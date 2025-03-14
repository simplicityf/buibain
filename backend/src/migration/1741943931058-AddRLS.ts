import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRLS1741943931058 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable Row-Level Security on messages table
        await queryRunner.query(`ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY`);

        // Policy: Users can only see their own messages
        await queryRunner.query(`
            CREATE POLICY user_can_view_own_messages
            ON "messages"
            FOR SELECT
            USING ("senderId" = auth.uid())
        `);

        // Policy: Users can only insert their own messages
        await queryRunner.query(`
            CREATE POLICY user_can_insert_messages
            ON "messages"
            FOR INSERT
            WITH CHECK ("senderId" = auth.uid())
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove policies if migration is rolled back
        await queryRunner.query(`DROP POLICY user_can_view_own_messages ON "messages"`);
        await queryRunner.query(`DROP POLICY user_can_insert_messages ON "messages"`);

        // Disable Row-Level Security (optional)
        await queryRunner.query(`ALTER TABLE "messages" DISABLE ROW LEVEL SECURITY`);
    }
}
