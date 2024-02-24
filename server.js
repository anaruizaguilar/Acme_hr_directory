const pg = require('pg');
const express = require('express');
const app = express();

const client = new pg.Client(process.env.DATABASE_URL || 'postgress://localhost/acme_hr_directory_db');

app.use(express.json());
app.use(require('morgan')('dev'));

app.get('/api/departments', async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM departments;`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
})

app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `SELECT * FROM employees;`;
        const response = await client.query(SQL);
        res.send(response.rows);
    } catch (error) {
        next(error);
    }
})

app.post('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
                INSERT INTO employees(name, department_id)
                VALUES($1, $2)
                RETURNING *;
                `;
        const response = await client.query(SQL, [req.body.name, req.body.department_id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
})

app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
                UPDATE employees
                SET department_id=$1, updated_at=now()
                WHERE id=$2
                RETURNING *;
                `;
        const response = await client.query(SQL, [req.body.department_id, req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        next(error);
    }
})
app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
                DELETE FROM employees
                WHERE id=$1
                `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
})

const init = async () => {
    await client.connect();
    let SQL = `
        DROP TABLE IF EXISTS employees;
        DROP TABLE IF EXISTS departments;
        CREATE TABLE departments(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100)
        );
        CREATE TABLE employees(
            id SERIAL PRIMARY KEY,
            name VARCHAR(200),
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now(),
            department_id INTEGER REFERENCES departments(id) NOT NULL
        )`;
    await client.query(SQL);
    console.log('tables created');

    SQL = `
        INSERT INTO departments(name) VALUES('Accounting');
        INSERT INTO departments(name) VALUES('Hit-men');
        INSERT INTO departments(name) VALUES('HR');
        INSERT INTO employees(name, department_id) VALUES('Knapp, Anita', (SELECT id FROM departments WHERE name='Accounting'));
        INSERT INTO employees(name, department_id) VALUES('Kiddo, Beatrix', (SELECT id FROM departments WHERE name='Hit-men'));
        INSERT INTO employees(name, department_id) VALUES('Carr, Estelle', (SELECT id FROM departments WHERE name='HR'));
        `;
    await client.query(SQL);
    console.log('data seeded');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`App listening in port ${PORT}`);
    })
}

init();