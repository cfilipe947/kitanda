import { OpenApiGeneratorV3, OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { loginSchema, registerSchema } from './modules/auth/auth.schemas.js';
import {
  categoryParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from './modules/categories/categories.schemas.js';
import {
  createProductSchema,
  listProductsQuerySchema,
  productParamsSchema,
  stockMovementSchema,
  updateProductSchema,
} from './modules/products/products.schemas.js';
import { salesByDayQuerySchema, topProductsQuerySchema } from './modules/reports/reports.schemas.js';
import { createSaleSchema, listSalesQuerySchema, saleParamsSchema } from './modules/sales/sales.schemas.js';
import { createUserSchema } from './modules/users/users.schemas.js';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const errorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.array(z.unknown()) }),
});

function json(schema: z.ZodType) {
  return { content: { 'application/json': { schema } } };
}

function errorResponses(...statuses: number[]) {
  return Object.fromEntries(statuses.map((status) => [status, { description: 'Erro', ...json(errorSchema) }]));
}

const auth = [{ bearerAuth: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/v1/health',
  tags: ['Sistema'],
  summary: 'Estado da API e da ligação à base de dados',
  responses: {
    200: { description: 'OK', ...json(z.object({ status: z.literal('ok'), uptime: z.number() })) },
    503: { description: 'Base de dados em baixo', ...json(z.object({ status: z.literal('error'), uptime: z.number() })) },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Autenticação'],
  summary: 'Cria o primeiro utilizador (ADMIN). Bloqueado depois de existir um utilizador.',
  request: { body: json(registerSchema) },
  responses: { 201: { description: 'Criado' }, ...errorResponses(400, 403) },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/login',
  tags: ['Autenticação'],
  summary: 'Autentica e devolve um JWT (5 tentativas/minuto por IP)',
  request: { body: json(loginSchema) },
  responses: { 200: { description: 'OK' }, ...errorResponses(400, 401, 429) },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/demo/start',
  tags: ['Autenticação'],
  summary:
    'Repõe a loja de demonstração com os dados padrão e devolve um JWT do admin de demonstração. Só existe com DEMO_MODE=true (10 pedidos/minuto por IP)',
  responses: { 200: { description: 'OK' }, ...errorResponses(404, 429) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/me',
  tags: ['Autenticação'],
  summary: 'Utilizador autenticado',
  security: auth,
  responses: { 200: { description: 'OK' }, ...errorResponses(401) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/users',
  tags: ['Utilizadores'],
  summary: 'Lista utilizadores (ADMIN)',
  security: auth,
  responses: { 200: { description: 'OK' }, ...errorResponses(401, 403) },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/users',
  tags: ['Utilizadores'],
  summary: 'Cria um utilizador (ADMIN)',
  security: auth,
  request: { body: json(createUserSchema) },
  responses: { 201: { description: 'Criado' }, ...errorResponses(400, 401, 403, 409) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/categories',
  tags: ['Categorias'],
  summary: 'Lista categorias',
  security: auth,
  responses: { 200: { description: 'OK' }, ...errorResponses(401) },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/categories',
  tags: ['Categorias'],
  summary: 'Cria uma categoria (ADMIN)',
  security: auth,
  request: { body: json(createCategorySchema) },
  responses: { 201: { description: 'Criado' }, ...errorResponses(400, 401, 403, 409) },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/categories/{id}',
  tags: ['Categorias'],
  summary: 'Edita uma categoria (ADMIN)',
  security: auth,
  request: { params: categoryParamsSchema, body: json(updateCategorySchema) },
  responses: { 200: { description: 'OK' }, ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/categories/{id}',
  tags: ['Categorias'],
  summary: 'Apaga uma categoria vazia (ADMIN)',
  security: auth,
  request: { params: categoryParamsSchema },
  responses: { 204: { description: 'Apagada' }, ...errorResponses(401, 403, 404, 409) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/products',
  tags: ['Produtos'],
  summary: 'Lista paginada de produtos activos',
  security: auth,
  request: { query: listProductsQuerySchema },
  responses: { 200: { description: 'OK' }, ...errorResponses(401) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/products/{id}',
  tags: ['Produtos'],
  summary: 'Detalhe de um produto com os últimos movimentos de stock',
  security: auth,
  request: { params: productParamsSchema },
  responses: { 200: { description: 'OK' }, ...errorResponses(401, 404) },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/products',
  tags: ['Produtos'],
  summary: 'Cria um produto (ADMIN)',
  security: auth,
  request: { body: json(createProductSchema) },
  responses: { 201: { description: 'Criado' }, ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/products/{id}',
  tags: ['Produtos'],
  summary: 'Edita um produto (ADMIN). Nunca altera stockQuantity.',
  security: auth,
  request: { params: productParamsSchema, body: json(updateProductSchema) },
  responses: { 200: { description: 'OK' }, ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/products/{id}',
  tags: ['Produtos'],
  summary: 'Soft delete de um produto (ADMIN)',
  security: auth,
  request: { params: productParamsSchema },
  responses: { 204: { description: 'Apagado' }, ...errorResponses(401, 403, 404) },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/products/{id}/stock',
  tags: ['Produtos'],
  summary: 'Regista uma entrada (IN) ou um ajuste (ADJUSTMENT) de stock (ADMIN)',
  security: auth,
  request: { params: productParamsSchema, body: json(stockMovementSchema) },
  responses: { 201: { description: 'Criado' }, ...errorResponses(400, 401, 403, 404, 409) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/sales',
  tags: ['Vendas'],
  summary: 'Lista paginada de vendas, com filtro por datas',
  security: auth,
  request: { query: listSalesQuerySchema },
  responses: { 200: { description: 'OK' }, ...errorResponses(401) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/sales/{id}',
  tags: ['Vendas'],
  summary: 'Detalhe de uma venda com os itens',
  security: auth,
  request: { params: saleParamsSchema },
  responses: { 200: { description: 'OK' }, ...errorResponses(401, 404) },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/sales',
  tags: ['Vendas'],
  summary: 'Regista uma venda em transacção (reduz stock, cria movimentos OUT)',
  security: auth,
  request: { body: json(createSaleSchema) },
  responses: { 201: { description: 'Criada' }, ...errorResponses(400, 401, 404, 409) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reports/summary',
  tags: ['Relatórios'],
  summary: 'Vendas de hoje, do mês, e nº de produtos em stock baixo (ADMIN)',
  security: auth,
  responses: { 200: { description: 'OK' }, ...errorResponses(401, 403) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reports/sales-by-day',
  tags: ['Relatórios'],
  summary: 'Série diária de vendas para o gráfico (ADMIN)',
  security: auth,
  request: { query: salesByDayQuerySchema },
  responses: { 200: { description: 'OK' }, ...errorResponses(401, 403) },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/reports/top-products',
  tags: ['Relatórios'],
  summary: 'Produtos mais vendidos, por quantidade (ADMIN)',
  security: auth,
  request: { query: topProductsQuerySchema },
  responses: { 200: { description: 'OK' }, ...errorResponses(401, 403) },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Kitanda API',
      version: '1.0.0',
      description: 'Gestão de stock e vendas para pequenas lojas e cantinas em Angola.',
    },
    servers: [{ url: '/' }],
  });
}
