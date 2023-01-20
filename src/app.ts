// OOPS BASED PROGRAMMING

// autobind decorator( to decorate a method to the root class)
function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const modifiedDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: false,

    get() {
      const toBind = originalMethod.bind(this);
      return toBind;
    },
  };
  return modifiedDescriptor;
}

// To Do List Class
class TaskList {
  templateElem: HTMLTemplateElement;
  toRender: HTMLDivElement;
  listElem: HTMLElement;

  constructor(private type: "ongoing" | "completed") {
    this.templateElem = document.getElementById(
      "tasks-list"
    )! as HTMLTemplateElement;
    this.toRender = document.getElementById("app")! as HTMLDivElement;
    const importedElem = document.importNode(this.templateElem.content, true);

    this.listElem = importedElem.firstElementChild as HTMLElement;
    this.listElem.id = `${this.type}-tasks`;

    this.attach();

    // Render after instantiating
    this.renderContent();
  }

  private renderContent() {
    const listId = `${this.type}-tasks-list`;
    this.listElem.querySelector("ul")!.id = listId;
    this.listElem.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " TASKS";
  }

  private attach() {
    this.toRender.insertAdjacentElement("beforeend", this.listElem);
  }
}

// Global state management for task list
class taskStateManagement {
  private listeners: any[] = [];
  private tasks: any[] = [];
  private static instance: taskStateManagement;

  // singleton pattern
  private constructor() {}

  addTask(title: string, description: string) {
    const task = {
      id: Math.floor(Math.random() * 100 + 1),
      title: title,
      description: description,
    };
    this.tasks.push(task);

    for (const listenerFn of this.listeners) {
      // copy of array as array are a refernce obj in js
      listenerFn(this.tasks.slice());
    }
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new taskStateManagement();
    return this.instance;
  }

  addListener(listenerFn: Function) {
    this.listeners.push(listenerFn);
  }
}

// To Do Form class
class ToDoForm {
  templateElem: HTMLTemplateElement;
  toRender: HTMLDivElement;
  formElement: HTMLFormElement;

  // form input elements
  titleInput: HTMLInputElement;
  descriptionInput: HTMLInputElement;

  constructor() {
    // get input elements
    this.templateElem = document.getElementById(
      "tasks-input"
    )! as HTMLTemplateElement;
    this.toRender = document.getElementById("app")! as HTMLDivElement;

    // (DocumentFragment, const in constructor)
    const importedElem = document.importNode(this.templateElem.content, true);

    this.formElement = importedElem.firstElementChild as HTMLFormElement;

    // applying css
    this.formElement.id = "user-input";

    // attaching input elemets
    this.titleInput = this.formElement.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descriptionInput = this.formElement.querySelector(
      "#description"
    ) as HTMLInputElement;

    // Configure everything before rending (i.e attaching a instance)
    this.configure();

    // to render form in constructor itself when instantiated
    this.attach();
  }

  private clearInputs() {
    this.titleInput.value = "";
    this.descriptionInput.value = "";
  }

  private getUserInput(): [string, string] | void {
    const itemTitle = this.titleInput.value;
    const itemDescription = this.descriptionInput.value;

    if (itemTitle.trim().length === 0 || itemDescription.trim().length === 0) {
      alert("Invalid input.");
      return;
    } else {
      return [itemTitle, itemDescription];
    }
  }

  @autobind
  private onSubmit(event: Event) {
    event.preventDefault();
    const userInput = this.getUserInput();
    if (Array.isArray(userInput)) {
      const [title, description] = userInput;
      console.log(title, description);

      taskState.addTask(title, description);

      this.clearInputs();
    }
  }

  private configure() {
    this.formElement.addEventListener("submit", this.onSubmit);
  }

  private attach() {
    this.toRender.insertAdjacentElement("afterbegin", this.formElement);
  }
}

// instantiate the class

const taskState = taskStateManagement.getInstance();
const toDoForm = new ToDoForm();
const onGoingList = new TaskList("ongoing");
const completedList = new TaskList("completed");
