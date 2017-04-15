class Router {
  constructor() {
    this._interval = null;
    this._oldLocation = null;
    this._routes = [];

    this._listen = this._listen.bind(this);
    this._handleRouteChange = this._handleRouteChange.bind(this);
    this.add = this.add.bind(this);
    this.run = this.run.bind(this)
  }

  get _location() {
    return window.location
  }

  _handleRouteChange(loc) {
    const findRoute = pathname => {
      return this._routes.find(route => {
        return typeof route.pathname === 'string'
          ? pathname === route.pathname
          : !!pathname.match(route.pathname)
      })
    };

    const route = findRoute(loc.pathname);

    if (route) {
      route.callback(loc)
    } else {
      findRoute('*').callback()
    }
  }

  add(pathname, callback) {
    this._routes.push({pathname, callback: callback.bind(null, this)});
    return this
  }

  run() {
    this._listen(this._handleRouteChange)
  }

  navigate(path, state = {}) {
    return history.pushState(state, null, path)
  }

  navigateBack() {
    return history.back()
  }

  _listen(onChange) {
    clearInterval(this._interval);

    this._interval = setInterval(() => {
      if (this._oldLocation === null) {
        this._oldLocation = Object.assign({}, this._location);
        this._handleRouteChange(this._location)
      } else if (this._oldLocation.href === this._location.href) {
        // console.log('same location')
      } else {
        // console.log('change')
        this._oldLocation = Object.assign({}, this._location);
        onChange(this._location)
      }
    }, 50)
  }

  unlisten() {
    return clearInterval(this._interval)
  }
}

function p(elementType, props = {}, childrens = null) {
  const element = document.createElement(elementType);
  const keys =  Object.keys(props === null ? {} : props);

  if (keys.length) {
    keys.forEach(key => {
      switch (key) {
      case 'ref':
        props.ref(element);
        break;
      case 'style':
        typeof props[key] === 'string'
          ? element[key] = props[key]
          : Object.keys(props[key]).forEach(style => element.style[style] = props.style[style]);
        break;
      default:
        element[key] = props[key]
      }
    })
  }

  const append = item => typeof item === 'string'
    ? element.appendChild(document.createTextNode(item))
    : element.appendChild(item);

  if (childrens) {
    [].concat(childrens)
      .forEach(item => append(item))
  }

  return element
}

const router = new Router();

const store = {
  get(key) {return localStorage.getItem(key)},
  set(key, value) {return localStorage.setItem(key, value)},
  rv(key) {model[key].remove(); /*return localStorage.removeItem(key)*/},
    update(oldData) {
       this.cache = oldData;
    },
    add(obj={}){

        let inputs = Array.from(document.querySelectorAll(".inputUpdate"));
        const newData = inputs.map((i) => ({[i.name]: i.value}));
        Object.assign(obj,...newData);
        if(document.querySelector(".newAuthor")) {
            obj.id = (model.author.findAll().length + 1) + "";
            return    model.author.insert(obj)
        }
        else if (document.querySelector(".newBook")){
            obj.id = (model.book.findAll().length + 1) + "";
            return    model.book.insert(obj)
        }
        if(window.location.pathname === "/Update"){
            Object.assign(this.cache, obj);
                }
    }
};

class Model {
  defineModel(options) {
    this[options.name] = new Collection(options, this)
  }
}
const model = new Model();
class Collection {
  constructor(options, rootModel) {
    this._rootModel = rootModel;
    this._name = options.name;
    this._fields = options.fields;
    this._data = {}; //this._getInitialData()
  }

  // set _data(data) {
  //   this._data = data
  // }\
  remove(){
      delete this._data[store.cache.id];
  }

  insert(data) {
    if (this._validateData(data)) {
      this._data[data.id] = data;
      this._commit()
    } else {
      throw new Error({message: 'Bad data', data: data})
    }
  }

  find(value, key = 'id') {
    const element = this.findAll()
      .find(item => item[key] === value);

    return element
  }

  findAll() {
    const elements = Object.keys(this._data)
      .map(key => this._data[key]);
    return elements
  }

  _getInitialData() {
    try {
      const initialData = store.get(this._name);
      return JSON.parse(initialData);
    } catch (e) {
      console.log(e.message)
    }
  }


  _validateData(data) {
    const dataKeys = Object.keys(data);

    const status = dataKeys.every(key => {
      // debugger
      const field = this._fields[key];
      if (!field) {
        return false
      }

      if (field.ref) {
        const refKey = '_' + field.ref;
        data[refKey] = () => data[key].map(id => this._models[field.ref].find('id', id));
        return true
      }

      if (!(typeof data[key] === field.type)) {
        return false
      }

      if (field.presence && !data[key]) {
        return false
      }

      return true
    });

    return status
  }

  _commit() {
    try {
      store.set(this._name, JSON.stringify(this._data))
    } catch(e) {
      console.log('Commit error', this._data)
    }
  }
}


model.defineModel({
  name: 'author',
  fields: {
    id: {type: 'string'},
    fullName: {type: 'string', defaultTo: '', presence: true},
    avatarUrl: {type: 'string', defaultTo: 'http://placehold.it/100x300'},
    dateOfDeath: {type: 'string', defaultTo: ''},
    city: {type: 'string', defaultTo: ''},
    books: {ref: 'book'}
  }
});

model.defineModel({
  name: 'book',
  fields: {
    id: {type: 'string'},
    title: {type: 'string', defaultTo: ''},
    image: {type: 'string', defaultTo: 'http://placehold.it/100x300'},
    genre: {type: 'string', defaultTo: ''},
    year: {type: 'string', defaultTo: ''},
    authors: {ref: 'author'}
  }
});

model.author.insert({
  id: '1',
  fullName: 'Death Man',
  avatarUrl: '',
  dateOfDeath: '',
  city: '',
  books: ['1']
});

model.book.insert({
  id: '1',
  title: 'Book of Death Man',
  image: 'http://placehold.it/150x300',
  genre: 'Novel',
  year: '2000',
  authors: ['Death Man', "Second death author"]
});

model.book.insert({
  id: '2',
  title: 'Book of Second Death Man',
  image: 'http://placehold.it/150x300',
  genre: 'Novel',
  year: '2001',
  authors: ['Death Man author']
});

// const all = model.book.findAll()
// // debugger
// console.log(all[1]._author())

class BooksController {
  index(location) {
    const books = model.book.findAll();
    const view = renderBooksIndex(books);
    renderView(view)
  }

  show(_, location) {
    const id = location.pathname.split('/')[2];
    const book = model.book.find(id);
    const view = renderBooksShow(book);
    renderView(view)
  }
  authorsBook(_, location) {
      const id = location.pathname.split('/')[2];
      const book =  model.book.find(id);


          const children = [];
          book.authors.forEach((aut) => {
              const authorId = model.author.find(aut, "fullName");
              console.log(authorId);
              children.push(
              p(`a`,{ href : "#", onclick(evt) {evt.preventDefault(); router.navigate('/author/' + (authorId?authorId.id:"*"))}, textContent : `${aut}`})
          )});

      const aut = p("p", {class: "authors", textContent: "-Authors :"},children);
      const view =  renderBooksShow(book);//.appendChild(aut)

      view.appendChild(aut);

      renderView(view);
  }
}
class AuthorsController {
    index(location) {
        const authors = model.author.findAll();
        const view = renderAutorIndex(authors);
        renderView(view)
    }

    show(_, location) {
        const id = location.pathname.split('/')[2];
        const author = model.author.find(id);
        const view = renderAutorShow(author);
        renderView(view)
    }


    booksAuthor(_, location) {

        const id = location.pathname.split('/')[2];
        const author = model.author.find(id);

        let books = model.book.findAll();
        let filtered = books.filter(x => {
            return x.authors.some(el => {
                return   el === author.fullName
            })});
        let z =filtered.map(el =>
            p('a',{className: "books", href:"#", onclick(evt) {evt.preventDefault(); router.navigate('/books/' + el.id)},
                textContent: el.title}));
        const aut = p("div", {class: "authors" }, [
            p(`ul`, {textContent: " books:"},z)]);

        const view = renderAutorShow(aut);//.appendChild(aut)
        view.appendChild(aut);

        return renderView(view);

    }
}

const booksController = new BooksController();
const authorsController = new AuthorsController();

function renderView(view) {
  const root = document.getElementById('app');

  while (root.firstChild) {
    root.removeChild(root.firstChild)
  }

  root.appendChild(renderHeader());
  root.appendChild(view)
}
function renderDialog(view) {
    const dialogWind = document.querySelector("Dialog");
    const root = document.getElementById('app');
    if (!dialogWind) {
        root.appendChild(view)
    }
}
function renderBooksIndex(data) {
  const renderBook = book =>
    p('div', {className: 'book'}, [
      p('img', {src: book.image}),
      p('a', {href: '#', onclick(evt) {evt.preventDefault(); router.navigate('/books/' + book.id)}}, book.title)
    ]);

  return p('div', {className: 'books'}, data.map(renderBook))
}
function renderDookAuthors(){}
function renderBooksShow(book) {
  return p('div', {className: 'book'}, [
    p('img', {src: book.image}),
    p('a', {href: '#', onclick(evt) {evt.preventDefault(); router.navigate('/books/' + book.id)}}, book.title)
  ])
}
function renderAutorIndex(data) {
    const renderAutor = autor =>
        p('div', {className: 'autor'}, [
            p('a', {href: '#', onclick(evt) {evt.preventDefault(); router.navigate('/author/' + autor.id)}}, autor.fullName)
        ]);

    return p('div', {className: 'autor'}, data.map(renderAutor))
}
function renderAutorShow(autor) {
    return p('div', {className: 'author'}, [
        p('em', autor.id),
        p('a', {href: '#', onclick(evt) {evt.preventDefault(); router.navigate('/author/' + autor.id)}}, autor.fullName)
    ])
}
function renderNotFound(router) {
   let r = router._routes.filter((x) => {
       console.log(typeof x.pathname)
      return  x[window.location.pathname];
    });
            console.log(r)

  const view =
    p('div', {id: 'hello'}, [
      p('div', {textContent: '404! Not Found!'}),
      p('a', {href: '#', textContent: 'Перейти на головну', onclick(evt) {evt.preventDefault(); router.navigate('/')}}),
      p('a', {href: '#', textContent: 'Перейти назад', onclick(evt) {evt.preventDefault(); router.navigateBack()}})
    ]);

  return renderView(view)
}
function renderHeader() {
  return p('header', {id: 'header'}, [
    p('div', {className: 'title'},
      p('a', {href: '#', onclick(evt) {evt.preventDefault(); router.navigate('/')}}, 'Death poets\' community')
    ),
    p('div', {className: 'links'}, [
      p('a', {href: '#', onclick(evt) {evt.preventDefault(); router.navigate('/books')}}, 'Books'),
      ' ',
      p('a', {href: '#', onclick(evt) {evt.preventDefault(); router.navigate('/authors')}}, 'Authors'),
      p('div', {className: 'links add'}, [
          p('a', {href: '#', onclick(evt) {evt.preventDefault(); router.navigate('/add_Book')}}, '+ Add Books'),
          p('a', {href: '#', onclick(evt) {evt.preventDefault(); router.navigate('/add_Author')}}, '+ Add Author')
    ])
    ])
  ])
}
function renderAddBook() {
    if(document.querySelector("#Dialog")){
        document.querySelector("#Dialog").parentNode.removeChild(document.querySelector("#Dialog"))
    }

    const view =
        p('div', {id: 'Dialog'}, [
            p('div', {className: 'Add'},[
                p('div', {className: 'newBook', textContent: 'Добавити нову книгу'},[
                    p('input', {className : "inputUpdate",type: 'text', name: "title", placeholder: "Назва книги"}),
                    p('input', {className : "inputUpdate",type: 'text', name: 'image', placeholder: "Постер ( посилання )"}),
                    p('input', {className : "inputUpdate",type: 'text', name: 'genre', placeholder: "Жанр"}),
                    p('input', {className : "inputUpdate",type: 'text', name: "year", placeholder: "Рік випуску"}),
                    p('a', {href: '#', onclick(evt) {evt.preventDefault(); store.add(); router.navigateBack()}}, "Добавить")
                ])
            ])
        ]);
    if(!document.querySelector("#header")) {
        renderRoot();
        return renderDialog(view)
    }
    else {
        return renderDialog(view)
    }
}
function renderAddAuthor() {

    if (document.querySelector("#Dialog")){
        document.querySelector("#Dialog").parentNode.removeChild(document.querySelector("#Dialog"))
    }
    const view =
        p('div', {id: 'Dialog'}, [
            p('div', {className: 'Add'},[
                p('div', {className: 'newAuthor', textContent: 'Добавити нового автора'},[
                    p('input', {className : "inputUpdate",type: 'text', name: "fullName", placeholder: "ім`я автора"}),
                    p('input', {className : "inputUpdate",type: 'text', name: 'avatarUrl', placeholder: "Аватар автора (посилання)"}),
                    p('input', {className : "inputUpdate",type: 'text', name: 'dateOfDeath', placeholder: "Дата смерті"}),
                    p('input', {className : "inputUpdate",type: 'text', name: "city", placeholder: "Місто"}),
                    p('a', {href: '#', onclick(evt) {evt.preventDefault(); store.add(); router.navigateBack()}}, "Добавить")
                ])
            ])
        ]);
        if(!document.querySelector("#header")) {
            renderRoot();
            return renderDialog(view)
        }
        else {
            return renderDialog(view)
        }
}
function renderUpdate() {

    if (document.querySelector("#Dialog")){
        document.querySelector("#Dialog").parentNode.removeChild(document.querySelector("#Dialog"))
    }
    const view =
        p('div', {id: 'Dialog'}, [
            p('div', {className: 'Update'},[
                p('div', {className: 'new', textContent: ''},[
                    p('input', {className : "inputUpdate",type: 'text', name: "fullName", placeholder: "ім`я автора"}),
                    p('input', {className : "inputUpdate",type: 'text', name: 'avatarUrl', placeholder: "Аватар автора (посилання)"}),
                    p('input', {className : "inputUpdate",type: 'text', name: 'dateOfDeath', placeholder: "Дата смерті"}),
                    p('input', {className : "inputUpdate",type: 'text', name: "city", placeholder: "Місто"}),
                    p('a', {href: '#', onclick(evt) {evt.preventDefault(); store.add()}}, "Добавить")
                ])
            ])
        ]);
    if(!document.querySelector("#header")) {
        renderRoot();
        return renderDialog(view)
    }
    else {
        return renderDialog(view)
    }
}
function renderRoot(router) {

  const view =
    p('div', {id: 'header'}, [
      p('div', {textContent: 'Привіт, TernopilJS!'}),
      p('div', {textContent: ' Базовий приклад SPA без використання сторонніх бібліотек.'}),
      p('a', {href: '#', textContent: 'Перейти на привітання', onclick(evt) {evt.preventDefault(); router.navigate('/hello')}}),
      p('a', {href: '#', textContent: 'Перейти назад', onclick(evt) {evt.preventDefault(); router.navigateBack()}})
    ]);
  return renderView(view)
}
function renderContextMenu() {
    return view = p("div",{className: "contextMenu"}, [
        p("a", {href: "/Update", onclick(evt) {evt.preventDefault(); router.navigate("/Update")}}, "Update"),
        p("a", {href: "#",onclick(event) {event.preventDefault();  store.rv((store.cache.fullName ? `author` : `book`))}}, "Remoove")
    ])

}

class App {
  constructor() {
    this._init()
  }

  _init() {
    document.addEventListener("DOMContentLoaded", () => router.run())
  }
}

// PUT /books/123 update
// /authors
// /comments

document.addEventListener("contextmenu", event => {

    if (event.target.closest("#app")&& event.target.tagName === "A"){
        event.preventDefault();
        if( document.querySelector(".contextMenu")) {
            document.querySelector(".contextMenu").parentNode.removeChild(document.querySelector(".contextMenu"));
        }
        const menu = renderContextMenu();

        document.querySelector("body").appendChild(menu);
        console.log(event.clientY,event.clientX)
        menu.style.top = (event.pageY +10) + "px";
        menu.style.left = (event.pageX +10) + "px";

    //   adding((model.author.find(event.target.textContent, "fullName") ?  model.author.find(event.target.textContent, "fullName"): model.book.find(event.target.textContent, "title")))
        return store.cache = (model.author.find(event.target.textContent, "fullName") ?  model.author.find(event.target.textContent, "fullName"): model.book.find(event.target.textContent, "title"))
    }

});
document.addEventListener("click", (event) => {

    if (document.querySelector(".contextMenu")){
        document.querySelector(".contextMenu").parentNode.removeChild( document.querySelector(".contextMenu"));
    }
    if (document.querySelector("#Dialog")){
        document.querySelector("#Dialog").parentNode.removeChild(document.querySelector("#Dialog"));
        router.navigateBack();
    }
});

router
  .add('/', renderRoot)
  .add('/books', booksController.index)
  //.add(/(\/books\/)(\d+)/, booksController.show)
  .add(/(\/books\/)(\d+)/, booksController.authorsBook)
  .add('/authors', authorsController.index)
  .add('/add_Author', renderAddAuthor)
  .add('/Update', renderUpdate)
  .add('/add_Book', renderAddBook)
  .add(/(\/authors\/)(\d+)/, authorsController.show)
  .add(/(\/books\/)(\d+)/, authorsController.show)
  .add(/(\/author\/)(\d+)/,authorsController.booksAuthor)
  .add('*', renderNotFound);

const app = new App();
