export const up = async function (knex) {
  // Check if the annual_leave_reset_date setting already exists
  const [existingSetting] = await knex('project_settings')
    .where('setting_key', 'annual_leave_reset_date')
    .select('id');

  if (!existingSetting) {
    // Insert annual leave reset date (July 16)
    await knex('project_settings').insert({
      setting_key: 'annual_leave_reset_date',
      setting_value: '07-16',
      description: 'The date when annual leave allowance resets (format: MM-DD)'
    });
    console.log('Added annual_leave_reset_date setting');
  }

  // Ensure annual_leave_days setting exists with default value
  const [existingLeaveAllowance] = await knex('project_settings')
    .where('setting_key', 'annual_leave_days')
    .select('id');

  if (!existingLeaveAllowance) {
    await knex('project_settings').insert({
      setting_key: 'annual_leave_days',
      setting_value: '14',
      description: 'Default annual leave days allocated per employee'
    });
    console.log('Added annual_leave_days setting');
  }
};

export const down = async function (knex) {
  await knex('project_settings')
    .where('setting_key', 'annual_leave_reset_date')
    .del();
  
  console.log('Removed annual_leave_reset_date setting');
};