const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// --- API ĐỌC DỮ LIỆU ---

// Lấy toàn bộ dữ liệu khởi tạo cho ứng dụng
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
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- API XÁC THỰC ---

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
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// --- API GHI DỮ LIỆU (CREATE, UPDATE) ---

// Cập nhật User
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, role, first_name, last_name, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET username = $1, role = $2, first_name = $3, last_name = $4, description = $5 WHERE id = $6 RETURNING *',
            [username, role, first_name, last_name, description, id]
        );
        if (result.rows.length > 0) res.json(result.rows[0]);
        else res.status(404).json({ error: 'User not found' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cập nhật trạng thái Drill (Open, Close)
app.put('/api/drills/:id/status', async (req, res) => {
    const { id } = req.params;
    const { execution_status, timestamp } = req.body; // 'InProgress' or 'Closed'
    
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
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cập nhật trạng thái Scenario (approve, reject, submit)
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
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Cập nhật (UPSERT) một bước thực thi
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
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cập nhật (UPSERT) xác nhận kịch bản
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
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
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

