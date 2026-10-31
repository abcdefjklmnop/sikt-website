// Deploy separately as a scheduled Worker using the same D1 database as Pages.
// No submitted content, raw IP addresses or secrets are logged.
interface Env {
  CONTACT_DB: {
    prepare(sql: string): { bind(value: number): { run(): Promise<unknown> } };
  };
}
export default {
  async scheduled(_event: unknown, env: Env): Promise<void> {
    await env.CONTACT_DB.prepare('DELETE FROM contact_rate_limits WHERE expires_at <= ?1')
      .bind(Math.floor(Date.now() / 1000)).run();
  },
};
