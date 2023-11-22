import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { Pool, QueryResult } from "pg";
import { error, log } from "console";

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'api',
  password: 'password',
  port: 5432,
});



function getProdutcts(req: Request, res: Response): void {
  pool.query('SELECT * FROM products', (error: Error, results: QueryResult) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
}
function getPedidos(req: Request, res: Response): void {
  pool.query('SELECT * FROM pedidos', (error: Error, results: QueryResult) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
}
function createProduct(req: Request, res: Response): void {
  console.log(req);
  

  const { name, price, stock_amount } = req.body;

  // Verifica se a tabela products existe, caso não exista, cria
  pool.query('CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, price MONEY, stock_amount INT)', (error: Error) => {
    if (error) {
      throw error;
    }

    // Insere o novo produto na tabela
    pool.query('INSERT INTO products (name, price, stock_amount) VALUES ($1, $2, $3) RETURNING *', [name, price, stock_amount],  (error: Error, results: QueryResult) => {
      if (error) {
        throw error;
      }
      res.status(201).json(results.rows[0]);
    });
  });
}

function cadastrarPedido(req: Request, res: Response): void {
  const { name, productId, address } = req.body;

  // Cria a tabela 'products' se ela não existir
  pool.query(
    'CREATE TABLE IF NOT EXISTS pedidos (id SERIAL PRIMARY KEY, client VARCHAR(255) NOT NULL, product JSONB, address VARCHAR(255))',
    (error: Error) => {
      if (error) {
        throw error;
      }

      // Seleciona o produto com base no ID
      pool.query('SELECT id, name, price FROM products WHERE id = $1;', [productId], (error: Error, results: QueryResult) => {
        if (error) {
          throw error;
        }

        // Obtém os resultados da consulta
        const product = results.rows[0]; // Assuming you want the first result

        // Verifica se o produto foi encontrado
        if (!product) {
          res.status(404).json({ message: 'Produto não encontrado' });
          return;
        }

        const data = [name, { id: product.id, name: product.name, price: product.price }, address];
        pool.query(
          'INSERT INTO pedidos (client, product, address) VALUES ($1, $2, $3);',
          data,
          (error: Error, results: QueryResult) => {
            if (error) {
              throw error;
            }
            res.status(201).json(results.rows);
          }
        );
      });
    }
  );
}

function deleteProduct(req:Request, res:Response):void {
  const {id}= req.body
  pool.query('DELETE FROM products WHERE id = $1;',[id],(error: Error, results:QueryResult)=>{
    if(error){
      throw error;
    }
    res.status(200).json(results.rowCount);
  } )
  
}

function updateProduct(req:Request, res:Response):void {
  const {id,local, value}= req.body;
  console.log(req.body);
  
  pool.query(`UPDATE products SET ${local} = $1 WHERE id = $2;`,[value, id],(error: Error, results:QueryResult)=>{
    if(error){
      throw error;
    }
    res.status(200).json(results);
  } )
  
}






app.get("/", getProdutcts);
app.get("/pedidos", getPedidos)
app.post("/products", createProduct);
app.post("/pedidos", cadastrarPedido);
app.delete("/products", deleteProduct);
app.put("/products", updateProduct)


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app
