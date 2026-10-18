# Library Books API Design

REST API design for a library's books resource.

## Endpoints

### 1. List all books
- **Method:** GET
- **Path:** `/books`
- **Description:** Retrieve a list of all books in the library.
- **Success status code:** 200

### 2. Get one book
- **Method:** GET
- **Path:** `/books/:id`
- **Description:** Retrieve a single book by its unique ID.
- **Success status code:** 200

### 3. Create a book
- **Method:** POST
- **Path:** `/books`
- **Description:** Add a new book to the library.
- **Example request body:**
  ```json
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "publishedYear": 1925
  }
  ```
- **Success status code:** 201

### 4. Update a book
- **Method:** PUT
- **Path:** `/books/:id`
- **Description:** Replace an existing book's details with the provided data.
- **Example request body:**
  ```json
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "publishedYear": 1925
  }
  ```
- **Success status code:** 200

### 5. Delete a book
- **Method:** DELETE
- **Path:** `/books/:id`
- **Description:** Remove a book from the library by its ID.
- **Success status code:** 204

### 6. List books by author
- **Method:** GET
- **Path:** `/books?author=name`
- **Description:** Retrieve all books written by a specific author using a query parameter.
- **Example:** `GET /books?author=F.%20Scott%20Fitzgerald`
- **Success status code:** 200

## Error Codes

### 400 Bad Request
- Occurs when the request is malformed or missing required fields.
- **Example:** Sending a POST request to `/books` without a `title` or `author` field in the body.

### 404 Not Found
- Occurs when the requested resource does not exist.
- **Example:** Sending a GET request to `/books/999` when no book with ID 999 exists in the library.
