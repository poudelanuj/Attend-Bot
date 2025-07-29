export const up = async function (knex) {
    // Create project_settings table
    await knex.schema.createTable('project_settings', (table) => {
        table.increments('id').primary();
        table.string('setting_key', 100).unique().notNullable();
        table.text('setting_value').notNullable();
        table.text('description').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Insert default project start date (today)
    await knex('project_settings').insert({
        setting_key: 'project_start_date',
        setting_value: new Date().toISOString().split('T')[0],
        description: 'The date when the attendance tracking project was deployed and started'
    });

    // Create leaves table
    await knex.schema.createTable('leaves', (table) => {
        table.increments('id').primary();
        table.integer('employee_id').unsigned().notNullable().references('id').inTable('employees').onDelete('CASCADE');
        table.date('date').notNullable();
        table.text('description').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.unique(['employee_id', 'date']);
    });

    // Add indexes
    await knex.schema.table('leaves', (table) => {
        table.index('date', 'idx_leaves_date');
        table.index(['employee_id', 'date'], 'idx_leaves_employee_date');
    });
};

export const down = async function (knex) {
    await knex.schema.dropTableIfExists('leaves');
    await knex.schema.dropTableIfExists('project_settings');
};