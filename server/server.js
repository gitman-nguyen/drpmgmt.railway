const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- API ĐỌC DỮ LIỆU ---

app.get('/api/data', async (req, res) => {
    try {
        const usersQuery = 'SELECT id, username, role, first_name, last_name, description FROM users';
        const drillsQuery = 'SELECT * FROM drills ORDER BY start_date DESC';
        const scenariosQuery = `
            SELECT s.*, COALESCE(
                (SELECT json_agg(steps.* ORDER BY steps.step_order) FROM steps WHERE steps.scenario_id = s.id),
                '[]'::json
            ) as steps
            FROM scenarios s
        `;
        const stepDepsQuery = 'SELECT * FROM step_dependencies';
        const drillScenariosQuery = 'SELECT * FROM drill_scenarios';
        const drillScenarioDepsQuery = 'SELECT * FROM drill_scenario_dependencies';
        const executionStepsQuery = 'SELECT * FROM execution_steps';
        const executionScenariosQuery = 'SELECT * FROM execution_scenarios';

        const results = await Promise.all([
            pool.query(usersQuery),
            pool.query(drillsQuery),
            pool.query(scenariosQuery),
            pool.query(stepDepsQuery),
            pool.query(drillScenariosQuery),
            pool.query(drillScenarioDepsQuery),
            pool.query(executionStepsQuery),
            pool.query(executionScenariosQuery)
        ]);
        
        const [
            usersRes,
            drillsRes,
            scenariosRes,
            stepDepsRes,
            drillScenariosRes,
            drillScenarioDepsRes,
            executionStepsRes,
            executionScenariosRes
        ] = results.map(r => r.rows);

        const scenarios = {};
        const steps = {};
        scenariosRes.forEach(scen => {
            const stepIds = [];
            if (scen.steps && scen.steps.length > 0) {
                scen.steps.forEach(step => {
                    const dependsOn = stepDepsRes
                        .filter(dep => dep.step_id === step.id)
                        .map(dep => dep.depends_on_step_id);
                    steps[step.id] = { ...step, dependsOn };
                    stepIds.push(step.id);
                });
            }
            scenarios[scen.id] = { ...scen, steps: stepIds };
        });

        const drills = drillsRes.map(drill => {
            const scenariosInDrill = drillScenariosRes
                .filter(ds => ds.drill_id === drill.id)
                .sort((a, b) => a.scenario_order - b.scenario_order)
                .map(ds => {
                    const dependsOn = drillScenarioDepsRes
                        .filter(dep => dep.drill_id === drill.id && dep.scenario_id === ds.scenario_id)
                        .map(dep => dep.depends_on_scenario_id);
                    return { id: ds.scenario_id, dependsOn };
                });
            return { ...drill, scenarios: scenariosInDrill };
        });
        
        const executionData = {};
        [...executionStepsRes, ...executionScenariosRes].forEach(exec => {
            if (!executionData[exec.drill_id]) {
                executionData[exec.drill_id] = {};
            }
            const key = exec.step_id || exec.scenario_id;
            executionData[exec.drill_id][key] = exec;
        });

        res.json({ users: usersRes, drills, scenarios, steps, executionData });

    } catch (err) {
        console.error('Error fetching initial data:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- API XÁC THỰC & USER ---

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.json({ id: user.id, name: user.username, role: user.role });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/users', async (req, res) => {
    const { username, role, first_name, last_name, description, password } = req.body;
    try {
        const newUser = await pool.query(
            'INSERT INTO users (id, username, password, role, first_name, last_name, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, role, first_name, last_name, description',
            [`user-${Date.now()}`, username, password || 'password', role, first_name, last_name, description]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Could not create user' });
    }
});

app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, role, first_name, last_name, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET username = $1, role = $2, first_name = $3, last_name = $4, description = $5 WHERE id = $6 RETURNING id, username, role, first_name, last_name, description',
            [username, role, first_name, last_name, description, id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'User not found' });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/users/:id/password', async (req, res) => {
    const { id } = req.params;
    const { new_password } = req.body;
    if (!new_password) return res.status(400).json({ error: 'New password is required' });
    try {
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [new_password, id]);
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('Admin password reset error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/user/change-password', async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    try {
        const userResult = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (userResult.rows[0].password !== oldPassword) {
            return res.status(403).json({ error: 'Incorrect old password' });
        }
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, userId]);
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('User change password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- API SCENARIOS ---

app.post('/api/scenarios', async (req, res) => {
    const { name, role, basis, status, created_by, steps, attachment } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const scenarioId = `scen-${Date.now()}`;
        const scenarioQuery = 'INSERT INTO scenarios (id, name, role, basis, status, created_by, attachment) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
        await client.query(scenarioQuery, [scenarioId, name, role, basis, status, created_by, attachment]);

        if (steps && steps.length > 0) {
            const tempIdToDbId = {};
            for (const [index, step] of steps.entries()) {
                const stepId = `step-${Date.now()}-${index}`;
                tempIdToDbId[step.id] = stepId;
                step.dbId = stepId;
                const stepQuery = 'INSERT INTO steps (id, scenario_id, title, description, estimated_time, step_order) VALUES ($1, $2, $3, $4, $5, $6)';
                await client.query(stepQuery, [stepId, scenarioId, step.title, step.description, step.estimated_time, index + 1]);
            }
            for (const step of steps) {
                if (step.dependsOn && step.dependsOn.length > 0) {
                    for (const depTempId of step.dependsOn) {
                        const depDbId = tempIdToDbId[depTempId];
                        if (depDbId) {
                            const depQuery = 'INSERT INTO step_dependencies (step_id, depends_on_step_id) VALUES ($1, $2)';
                            await client.query(depQuery, [step.dbId, depDbId]);
                        }
                    }
                }
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Scenario created successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create scenario error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});


app.put('/api/scenarios/:id', async (req, res) => {
    const { id } = req.params;
    const { name, role, basis, status, steps, attachment } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const scenarioQuery = 'UPDATE scenarios SET name = $1, role = $2, basis = $3, status = $4, last_updated_at = NOW(), attachment = $5 WHERE id = $6';
        await client.query(scenarioQuery, [name, role, basis, status, attachment, id]);

        await client.query('DELETE FROM step_dependencies WHERE step_id IN (SELECT id FROM steps WHERE scenario_id = $1)', [id]);
        await client.query('DELETE FROM steps WHERE scenario_id = $1', [id]);

        if (steps && steps.length > 0) {
            const tempIdToDbId = {};
            for (const [index, step] of steps.entries()) {
                const stepId = `step-${Date.now()}-${index}`;
                tempIdToDbId[step.id] = stepId;
                step.dbId = stepId;
                const stepQuery = 'INSERT INTO steps (id, scenario_id, title, description, estimated_time, step_order) VALUES ($1, $2, $3, $4, $5, $6)';
                await client.query(stepQuery, [stepId, id, step.title, step.description, step.estimated_time, index + 1]);
            }
             for (const step of steps) {
                if (step.dependsOn && step.dependsOn.length > 0) {
                    for (const depTempId of step.dependsOn) {
                        const depDbId = tempIdToDbId[depTempId];
                        if (depDbId) {
                            const depQuery = 'INSERT INTO step_dependencies (step_id, depends_on_step_id) VALUES ($1, $2)';
                            await client.query(depQuery, [step.dbId, depDbId]);
                        }
                    }
                }
            }
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Scenario updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update scenario error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

app.put('/api/scenarios/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE scenarios SET status = $1, last_updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Scenario not found' });
    } catch (err) {
        console.error('Update scenario status error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/scenarios/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM drill_scenario_dependencies WHERE scenario_id = $1 OR depends_on_scenario_id = $1', [id]);
        await client.query('DELETE FROM drill_scenarios WHERE scenario_id = $1', [id]);
        await client.query('DELETE FROM step_dependencies WHERE step_id IN (SELECT id FROM steps WHERE scenario_id = $1)', [id]);
        await client.query('DELETE FROM execution_steps WHERE step_id IN (SELECT id FROM steps WHERE scenario_id = $1)', [id]);
        await client.query('DELETE FROM execution_scenarios WHERE scenario_id = $1', [id]);
        await client.query('DELETE FROM steps WHERE scenario_id = $1', [id]);
        const result = await client.query('DELETE FROM scenarios WHERE id = $1', [id]);
        await client.query('COMMIT');

        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Scenario deleted successfully' });
        } else {
            res.status(404).json({ error: 'Scenario not found' });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete scenario error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});


// --- API DRILLS & EXECUTION ---

app.post('/api/drills', async (req, res) => {
    const { name, description, basis, status, start_date, end_date, scenarios } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const drillId = `drill-${Date.now()}`;
        const drillQuery = 'INSERT INTO drills (id, name, description, basis, status, start_date, end_date, execution_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
        await client.query(drillQuery, [drillId, name, description, basis, status, start_date, end_date, 'Scheduled']);

        if (scenarios && scenarios.length > 0) {
            for (const [index, scen] of scenarios.entries()) {
                await client.query('INSERT INTO drill_scenarios (drill_id, scenario_id, scenario_order) VALUES ($1, $2, $3)', [drillId, scen.id, index + 1]);
                if (scen.dependsOn && scen.dependsOn.length > 0) {
                    for (const depId of scen.dependsOn) {
                        await client.query('INSERT INTO drill_scenario_dependencies (drill_id, scenario_id, depends_on_scenario_id) VALUES ($1, $2, $3)', [drillId, scen.id, depId]);
                    }
                }
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ message: 'Drill created successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Create drill error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

app.put('/api/drills/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, basis, status, start_date, end_date, scenarios } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const drillQuery = 'UPDATE drills SET name = $1, description = $2, basis = $3, status = $4, start_date = $5, end_date = $6 WHERE id = $7';
        await client.query(drillQuery, [name, description, basis, status, start_date, end_date, id]);

        await client.query('DELETE FROM drill_scenario_dependencies WHERE drill_id = $1', [id]);
        await client.query('DELETE FROM drill_scenarios WHERE drill_id = $1', [id]);

        if (scenarios && scenarios.length > 0) {
            for (const [index, scen] of scenarios.entries()) {
                await client.query('INSERT INTO drill_scenarios (drill_id, scenario_id, scenario_order) VALUES ($1, $2, $3)', [id, scen.id, index + 1]);
                if (scen.dependsOn && scen.dependsOn.length > 0) {
                    for (const depId of scen.dependsOn) {
                        await client.query('INSERT INTO drill_scenario_dependencies (drill_id, scenario_id, depends_on_scenario_id) VALUES ($1, $2, $3)', [id, scen.id, depId]);
                    }
                }
            }
        }
        await client.query('COMMIT');
        res.status(200).json({ message: 'Drill updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update drill error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});


app.put('/api/drills/:id/status', async (req, res) => {
    const { id } = req.params;
    const { execution_status, timestamp } = req.body;
    let query;
    if (execution_status === 'InProgress') {
        query = { text: 'UPDATE drills SET execution_status = $1, opened_at = $2 WHERE id = $3 RETURNING *', values: [execution_status, timestamp, id] };
    } else if (execution_status === 'Closed') {
        query = { text: 'UPDATE drills SET execution_status = $1, closed_at = $2 WHERE id = $3 RETURNING *', values: [execution_status, timestamp, id] };
    } else {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        const result = await pool.query(query);
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'Drill not found' });
    } catch (err) {
        console.error('Update drill status error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/execution/step', async (req, res) => {
    const { drill_id, step_id, status, started_at, completed_at, assignee, result_text } = req.body;
    try {
        const query = `
            INSERT INTO execution_steps (drill_id, step_id, status, started_at, completed_at, assignee, result_text)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (drill_id, step_id)
            DO UPDATE SET
                status = EXCLUDED.status,
                started_at = COALESCE(execution_steps.started_at, EXCLUDED.started_at),
                completed_at = EXCLUDED.completed_at,
                assignee = COALESCE(execution_steps.assignee, EXCLUDED.assignee),
                result_text = EXCLUDED.result_text
            RETURNING *;
        `;
        const result = await pool.query(query, [drill_id, step_id, status, started_at, completed_at, assignee, result_text]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Upsert execution step error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/execution/scenario', async (req, res) => {
    const { drill_id, scenario_id, final_status, final_reason } = req.body;
    try {
        const query = `
            INSERT INTO execution_scenarios (drill_id, scenario_id, final_status, final_reason)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (drill_id, scenario_id)
            DO UPDATE SET final_status = EXCLUDED.final_status, final_reason = EXCLUDED.final_reason
            RETURNING *;
        `;
        const result = await pool.query(query, [drill_id, scenario_id, final_status, final_reason]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Upsert execution scenario error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- API QUẢN TRỊ ---

app.post('/api/admin/cleanup-history', async (req, res) => {
    const { months } = req.body;
    // Cần kiểm tra quyền Admin ở đây trong ứng dụng thực tế
    
    if (![3, 6, 12].includes(parseInt(months))) {
        return res.status(400).json({ error: 'Invalid time period.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(months));

        const drillsToDeleteQuery = `SELECT id FROM drills WHERE status = 'Closed' AND closed_at < $1`;
        const drillsResult = await client.query(drillsToDeleteQuery, [cutoffDate]);
        const drillIdsToDelete = drillsResult.rows.map(r => r.id);

        if (drillIdsToDelete.length > 0) {
            await client.query('DELETE FROM execution_steps WHERE drill_id = ANY($1::text[])', [drillIdsToDelete]);
            await client.query('DELETE FROM execution_scenarios WHERE drill_id = ANY($1::text[])', [drillIdsToDelete]);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: `Successfully cleaned up execution data for ${drillIdsToDelete.length} drills.` });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Cleanup history error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

app.post('/api/admin/reset-system', async (req, res) => {
    // Cần kiểm tra quyền Admin ở đây trong ứng dụng thực tế
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Truncate xóa toàn bộ dữ liệu và reset lại sequence
        await client.query('TRUNCATE drills, drill_scenarios, drill_scenario_dependencies, execution_steps, execution_scenarios RESTART IDENTITY');
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'System has been reset successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('System reset error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

app.post('/api/admin/seed-demo-data', async (req, res) => {
    // Cần kiểm tra quyền Admin ở đây trong ứng dụng thực tế
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // --- THAY ĐỔI: Không xóa dữ liệu cũ, chỉ chèn nếu chưa tồn tại ---
        
        await client.query(`
            INSERT INTO users (id, username, password, role, first_name, last_name, description) VALUES
            ('user-1', 'admin', 'password', 'ADMIN', 'Admin', 'User', 'System Administrator'),
            ('user-2', 'tech_user', 'password', 'TECHNICAL', 'Tech', 'User', 'Database Specialist'),
            ('user-3', 'biz_user', 'password', 'BUSINESS', 'Business', 'User', 'Communications Lead')
            ON CONFLICT (id) DO NOTHING;
        `);
        
        await client.query(`
            INSERT INTO scenarios (id, name, role, created_by, created_at, last_updated_at, status, basis) VALUES
            ('scen-1', 'Chuyển đổi dự phòng Database', 'TECHNICAL', 'user-2', '2025-08-10T10:00:00Z', '2025-08-11T14:30:00Z', 'Active', 'Kế hoạch DR năm 2025'),
            ('scen-2', 'Truyền thông Khách hàng', 'BUSINESS', 'user-3', '2025-08-10T11:00:00Z', '2025-08-10T11:00:00Z', 'Active', 'Kế hoạch DR năm 2025'),
            ('scen-3', 'Kiểm tra hiệu năng hệ thống', 'TECHNICAL', 'user-2', '2025-08-11T09:00:00Z', '2025-08-12T11:00:00Z', 'Draft', '')
            ON CONFLICT (id) DO NOTHING;
        `);

        await client.query(`
            INSERT INTO steps (id, scenario_id, title, description, estimated_time, step_order) VALUES
            ('step-101', 'scen-1', 'Khởi tạo nâng cấp Read Replica của RDS', 'Promote the standby RDS instance in us-west-2 to become the new primary.', '00:15:00', 1),
            ('step-102', 'scen-1', 'Cập nhật bản ghi DNS', 'Point the primary DB CNAME record to the new primary instance endpoint.', '00:05:00', 2),
            ('step-103', 'scen-1', 'Xác minh kết nối ứng dụng', 'Run health checks on all critical applications to ensure they can connect to the new database.', '00:10:00', 3),
            ('step-201', 'scen-2', 'Soạn thảo cập nhật trạng thái nội bộ', 'Prepare an internal communication for all staff about the ongoing DR drill.', '00:20:00', 1),
            ('step-202', 'scen-2', 'Đăng lên trang trạng thái công khai', 'Update the public status page to inform customers about scheduled maintenance (simulated).', '00:05:00', 2),
            ('step-301', 'scen-3', 'Chạy bài test tải', 'Use JMeter to run a load test against the new primary application servers.', '01:00:00', 1)
            ON CONFLICT (id) DO NOTHING;
        `);

        await client.query(`
            INSERT INTO step_dependencies (step_id, depends_on_step_id) VALUES
            ('step-102', 'step-101'),
            ('step-103', 'step-102'),
            ('step-202', 'step-201')
            ON CONFLICT (step_id, depends_on_step_id) DO NOTHING;
        `);

        await client.query(`
            INSERT INTO drills (id, name, description, status, execution_status, basis, start_date, end_date, opened_at, closed_at) VALUES
            ('drill-1', 'Diễn tập chuyển đổi dự phòng AWS Quý 3', 'Mô phỏng chuyển đổi dự phòng toàn bộ khu vực cho các dịch vụ quan trọng.', 'Active', 'InProgress', 'Quyết định số 123/QĐ-NHNN ngày 01/01/2025', '2025-08-16', '2025-08-18', '2025-08-16T10:00:00Z', NULL)
            ON CONFLICT (id) DO NOTHING;
        `);

        await client.query(`
            INSERT INTO drill_scenarios (drill_id, scenario_id, scenario_order) VALUES
            ('drill-1', 'scen-1', 1),
            ('drill-1', 'scen-2', 2)
            ON CONFLICT (drill_id, scenario_id) DO NOTHING;
        `);

        await client.query(`
            INSERT INTO drill_scenario_dependencies (drill_id, scenario_id, depends_on_scenario_id) VALUES
            ('drill-1', 'scen-2', 'scen-1')
            ON CONFLICT (drill_id, scenario_id, depends_on_scenario_id) DO NOTHING;
        `);

        await client.query(`
            INSERT INTO execution_steps (drill_id, step_id, status, started_at, completed_at, assignee) VALUES
            ('drill-1', 'step-101', 'Completed-Success', '2025-08-16T10:00:00Z', '2025-08-16T10:14:00Z', 'tech_user'),
            ('drill-1', 'step-102', 'InProgress', '2025-08-16T10:15:00Z', NULL, 'tech_user')
            ON CONFLICT (drill_id, step_id) DO NOTHING;
        `);
        
        await client.query('COMMIT');
        res.status(200).json({ message: 'Demo data seeded successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seed demo data error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});


// --- Phục vụ Frontend ---
app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
