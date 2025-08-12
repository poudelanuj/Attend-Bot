export const up = async function (knex) {
    // Add work_from column to attendance table
    await knex.schema.table('attendance', (table) => {
        table.enum('work_from', ['office', 'remote']).nullable();
    });

    // Create holidays table
    await knex.schema.createTable('holidays', (table) => {
        table.increments('id').primary();
        table.date('date').notNullable().unique();
        table.string('name', 255).notNullable();
        table.text('description').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Add default Saturday holidays for current year
    const currentYear = new Date().getFullYear();
    const saturdays = [];
    
    for (let month = 0; month < 12; month++) {
        const firstDay = new Date(currentYear, month, 1);
        const lastDay = new Date(currentYear, month + 1, 0);
        
        for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
            if (day.getDay() === 6) { // Saturday
                saturdays.push({
                    date: day.toISOString().split('T')[0],
                    name: 'Saturday',
                    description: 'Weekly holiday'
                });
            }
        }
    }
    
    if (saturdays.length > 0) {
        await knex('holidays').insert(saturdays);
    }
};

export const down = async function (knex) {
    await knex.schema.dropTableIfExists('holidays');
    await knex.schema.table('attendance', (table) => {
        table.dropColumn('work_from');
    });
};