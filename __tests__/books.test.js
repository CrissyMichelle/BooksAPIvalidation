/** Integration tests for books routes */

process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

// identifier of a sample bood for testing
let book_isbn;

// setup and teardown functions
beforeEach(async () => {
    let result = await db.query(
        `INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year)
            VALUES(
                '123456789',
                'https://amazon.com/libre',
                'Nacho',
                'Spanish',
                1000,
                'Oracle Press',
                'Nacho Libre',
                2023
            )
            RETURNING isbn`
        );
        book_isbn = result.rows[0].isbn
});

afterEach(async () => {
    await db.query("DELETE FROM books");
});

afterAll(async () => {
    await db.end();
});

// tests
describe("POST /books", () => {
    test("Creates a new book", async () => {
        const response = await request(app)
                                .post('/books')
                                .send({
                                    isbn: '987654321',
                                    amazon_url: "https://amazon.com/test",
                                    author: 'T. Est',
                                    language: 'English',
                                    pages: 100,
                                    publisher: 'Test Inc.',
                                    title: 'Test Book',
                                    year: 1492
                                });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
    });
});

describe("GET /books", () => {
    test("Gets a list of just one book", async () => {
        const response = await request(app).get('/books');
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("amazon_url");
    });
});

describe("GET /books/:isbn", () => {
    test("Gets a single book", async () => {
        const response = await request(app).get(`/books/${book_isbn}`);
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.isbn).toBe(book_isbn);
    });

    test("Responds with 404 status code if book not found", async () => {
        const response = await request(app).get('/books/000');
        expect(response.statusCode).toBe(404);
    });
});

describe("PUT /books/:isbn", () => {
    test("Updates a single book", async () => {
        const response = await request(app)
                                .put(`/books/${book_isbn}`)
                                .send({
                                    amazon_url: "https://amazon.com/test",
                                    author: 'T. Est',
                                    language: 'English',
                                    pages: 100,
                                    publisher: 'Test Inc.',
                                    title: "Test Book",
                                    year: 1992
                                });
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.year).toBe(1992);
    });

    test("Prohibits invalid schema to update", async () => {
        const response = await request(app)
                                .put(`/books/${book_isbn}`)
                                .send({
                                    amazon_url: "https://amazon.com/test",
                                    author: 'T. Est',
                                    language: 'English',
                                    pages: 100,
                                    publisher: 'Test Inc.',
                                    title: "Test Book",
                                    year: 1992,
                                    extra: "I Don't Belong Here"
                                });
        expect(response.statusCode).toBe(400);
    });

    test("Responds with a 404 status code if book not found", async () => {
        // delete the test book first
        await request(app).delete(`/books/${book_isbn}`);
        // attempt to edit the deleted book
        const response = await request(app).put(`/books/${book_isbn}`);
        expect(response.statusCode).toBe(404);
    });
});

describe("DELETE /books/:isbn", () => {
    test("Deletes a specified book", async () => {
        const response = await request(app).delete(`/books/${book_isbn}`);
        expect(response.body).toEqual({message: "Book deleted"});
    });
});