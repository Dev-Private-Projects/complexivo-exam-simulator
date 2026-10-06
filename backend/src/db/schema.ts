import {
    boolean,
    index,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    description: text('description'),
});

export const questions = pgTable(
    'questions',
    {
        id: serial('id').primaryKey(),
        categoryId: integer('category_id')
            .notNull()
            .references(() => categories.id),
        statement: text('statement').notNull(),
        explanation: text('explanation'),
        createdAt: timestamp('created_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [index('questions_category_id_idx').on(table.categoryId)],
);

export const questionOptions = pgTable(
    'question_options',
    {
        id: serial('id').primaryKey(),
        questionId: integer('question_id')
            .notNull()
            .references(() => questions.id),
        text: text('text').notNull(),
        position: integer('position').notNull(),
        isCorrect: boolean('is_correct').default(false).notNull(),
    },
    (table) => [
        index('question_options_question_id_idx').on(table.questionId),
        uniqueIndex('question_options_question_id_position_uidx').on(
            table.questionId,
            table.position,
        ),
    ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type NewQuestionOption = typeof questionOptions.$inferInsert;