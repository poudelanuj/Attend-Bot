export const up = async function (knex) {
    await knex.schema.alterTable('employees', (table) => {
        // Drop old unique constraint & index for discord_id
        table.dropUnique(['discord_id']);
        table.dropIndex(['discord_id'], 'idx_employees_discord_id');

        // Rename column
        table.renameColumn('discord_id', 'platform_id');

        // Add new unique constraint & index for platform_id
        table.unique(['platform_id']);
        table.index(['platform_id'], 'idx_employees_platform_id');
    });
};

export const down = async function (knex) {
    await knex.schema.alterTable('employees', (table) => {
        // Drop platform_id constraints & index
        table.dropUnique(['platform_id']);
        table.dropIndex(['platform_id'], 'idx_employees_platform_id');

        // Rename column back
        table.renameColumn('platform_id', 'discord_id');

        // Restore original constraints/index
        table.unique(['discord_id']);
        table.index(['discord_id'], 'idx_employees_discord_id');
    });
};
