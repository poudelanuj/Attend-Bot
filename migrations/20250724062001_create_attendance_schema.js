import bcrypt from 'bcrypt';

export const up = async function (knex) {
    // Create employees table
    await knex.schema.createTable('employees', (table) => {
        table.increments('id').primary();
        table.string('discord_id', 20).unique().notNullable();
        table.string('username', 100).notNullable();
        table.string('display_name', 100);
        table.string('email', 255);
        table.string('department', 100);
        table.string('position', 100);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.boolean('is_active').defaultTo(true);
    });

    // Create attendance table
    await knex.schema.createTable('attendance', (table) => {
        table.increments('id').primary();
        table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
        table.timestamp('check_in_time').nullable();
        table.timestamp('check_out_time').nullable();
        table.date('date').notNullable();
        table.text('today_plan');
        table.text('yesterday_task');
        table.string('current_status', 500);
        table.text('accomplishments');
        table.text('blockers');
        table.text('tomorrow_priorities');
        table.integer('overall_rating');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        table.unique(['employee_id', 'date']);
    });

    // Create admin_users table
    await knex.schema.createTable('admin_users', (table) => {
        table.increments('id').primary();
        table.string('username', 50).unique().notNullable();
        table.string('password_hash', 255).notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });

    // Insert default admin user (password: admin123)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, saltRounds);
    await knex('admin_users').insert({
        username: process.env.ADMIN_USERNAME,
        password_hash: passwordHash,
    });

    // Create indexes
    await knex.schema.table('attendance', (table) => {
        table.index('date', 'idx_attendance_date');
        table.index(['employee_id', 'date'], 'idx_attendance_employee_date');
    });

    await knex.schema.table('employees', (table) => {
        table.index('discord_id', 'idx_employees_discord_id');
    });
};

export const down = async function (knex) {
    await knex.schema.dropTableIfExists('attendance');
    await knex.schema.dropTableIfExists('employees');
    await knex.schema.dropTableIfExists('admin_users');
};
