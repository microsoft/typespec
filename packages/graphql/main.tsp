namespace MyLibrary;

model Book {
  id: string;
  title: string;
  publicationDate: string;
  author: Author;
}

model Author {
  id: string;
  name: string;
  bio?: string;
  books: Book[];
}

