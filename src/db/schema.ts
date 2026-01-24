import { int, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'

export const tallasTable = sqliteTable('tallas', {
  id: int('id').primaryKey({ autoIncrement: true }),
  talla: text('talla').notNull(),
  nombre: text('nombre').notNull(),
})

export const estilosTable = sqliteTable('estilos', {
  id: int('id').primaryKey({ autoIncrement: true }),
  estilo: int('estilo').notNull(),
  nombre: text('nombre').notNull(),
  imagen: text('imagen').notNull(),
  precio: real('precio').notNull(),
})

export const pedidosTable = sqliteTable('pedidos', {
  id: int('id').primaryKey({ autoIncrement: true }),
  persona: text('persona').notNull(),
  nombre: text('nombre').notNull(),
  tallaId: int('talla_id')
    .notNull()
    .references(() => tallasTable.id),
  total: real('total').notNull(),
  pagado: int('pagado').notNull(), // 0 para no pagado, 1 para pagado (o boolean)
  abonado: real('abonado').notNull().default(0),
})

export const pedidoItemsTable = sqliteTable('pedido_items', {
  id: int('id').primaryKey({ autoIncrement: true }),
  pedidoId: int('pedido_id')
    .notNull()
    .references(() => pedidosTable.id, { onDelete: 'cascade' }),
  estiloId: int('estilo_id')
    .notNull()
    .references(() => estilosTable.id, { onDelete: 'cascade' }),
})
