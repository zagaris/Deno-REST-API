import { Application, Router } from 'https://deno.land/x/oak/mod.ts';
import { v4 } from 'https://deno.land/std/uuid/mod.ts';
import * as yup from 'https://cdn.pika.dev/yup@^0.28.1';

interface ErrorHandler extends Error {
  status: number;
}

interface Employee {
  id?: string;
  name: string;
  profession: string;
}

// employee validation
const employeeSchema = yup.object().shape({
  name: yup.string().trim().min(2).required(),
  profession: yup.string().trim().min(3).required()
});

const database = new Map<string, Employee>();

const router = new Router();


router.get('/', (ctx) => {
  ctx.response.body = {
    message: 'Welcome!'
  };
});

// Fetch all employees
router.get('/employees', (ctx) => {
  ctx.response.body = [...database.values()];
});


// Fetch a specific employee
router.get('/employees/:id', (ctx) => {
  const { id } = ctx.params;
  if (id && database.has(id)) {
    ctx.response.status = 200;
    ctx.response.body = database.get(id);
  } else {
    const error = new Error('Employee Not Found!') as ErrorHandler;
    error.status = 404;
    throw error;
  }
});

// Create a new employee
router.post('/employees', async (ctx) => {
  try {
    const body = await ctx.request.body();
    if (body.type !== 'json') 
      throw new Error('Invalid Body');
    const employee = (await employeeSchema.validate(body.value) as Employee);
    employee.id = v4.generate();
    database.set(employee.id, employee);
    ctx.response.body = employee;
  } catch (error) {
    error.status = 422;
    throw error;
  }
});

// Update an employee
router.put('/employees/:id', async (ctx) => {
  try {
    const { id } = ctx.params;
    const body = await ctx.request.body();
    if (body.type !== 'json') 
      throw new Error('Invalid Body');
    const employee = (await employeeSchema.validate(body.value) as Employee);
    employee.id = id;
    if (id && database.has(id)) {
      database.set(id, employee);
      ctx.response.body = employee;
    }
    else {
      const error = new Error('Employee Not Found!') as ErrorHandler;
      error.status = 404;
      throw error;
    }
  } catch (error) {
    error.status = 422;
    throw error;
  }
});


// Delete a specific employee 
router.delete('/employees/:id', (ctx) => {
  const { id } = ctx.params;
  if (id && database.has(id)) {
    ctx.response.status = 204;
    ctx.response.body = '';
    database.delete(id);
  } else {
    const error = new Error('Employee Not Found!') as ErrorHandler;
    error.status = 404;
    throw error;
  }
});



const app = new Application();

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const error = err as ErrorHandler;
    ctx.response.status = error.status || 500;
    ctx.response.body = {
      message: error.message,
    };
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log('server listening on http://localhost:5000');
await app.listen({ port: 5000 });