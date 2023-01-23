// OOPS BASED PROGRAMMING

// Base class component of general dom rendering
abstract class BaseComponent<T extends HTMLElement, U extends HTMLElement> {
  templateElem: HTMLTemplateElement;
  toRender: T;
  newElement: U;

  constructor(
    templateId: string,
    toRenderElement: string,
    position: string,
    newElementId?: string
  ) {
    this.templateElem = document.getElementById(
      templateId
    )! as HTMLTemplateElement;
    this.toRender = document.getElementById(toRenderElement)! as T;

    // (DocumentFragment, const in constructor)
    const importedElem = document.importNode(this.templateElem.content, true);

    this.newElement = importedElem.firstElementChild as U;

    if (newElementId) {
      this.newElement.id = newElementId;
    }

    // to render element in constructor itself when instantiated
    this.attach(position);
  }

  private attach(atPosition: any) {
    this.toRender.insertAdjacentElement(atPosition, this.newElement);
  }

  // Render after instantiating
  abstract renderContent(): void;

  // Configure everything before rending (i.e attaching a instance)
  abstract configure(): void;
}

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

// Drag and Drop interface

interface Draggable {
  // Handler functions
  dragStart(event: DragEvent): void;
  dragEnd(event: DragEvent): void;
}

interface DragTarget {
  // Handler functions
  dragOver(event: DragEvent): void;
  dragLeave(event: DragEvent): void;
  drop(event: DragEvent): void;
}

// ToDo class
enum taskStatus {
  ongoing,
  completed,
}

class Task {
  constructor(
    public id: number,
    public title: string,
    public description: string,
    public status: taskStatus
  ) {}
}

// Task item class
class TaskItem
  extends BaseComponent<HTMLUListElement, HTMLLIElement>
  implements Draggable
{
  private task: Task;

  constructor(toRenderId: string, task: Task) {
    super("single-tasks", toRenderId, "beforeEnd", task.id.toString());
    this.task = task;

    this.configure();
    this.renderContent();
  }

  @autobind
  dragStart(event: DragEvent): void {
    console.log(event);
    event.dataTransfer!.setData("text/plain", this.task.id.toString());
    event.dataTransfer!.effectAllowed = "move";
  }

  dragEnd(_: DragEvent): void {
    console.log("Drag end");
  }

  configure(): void {
    this.newElement.addEventListener("dragstart", this.dragStart);
    this.newElement.addEventListener("dragend", this.dragEnd);
  }

  renderContent(): void {
    this.newElement.querySelector("h2")!.textContent = this.task.title;
    this.newElement.querySelector("p")!.textContent = this.task.description;
  }
}

// To Do List Class
class TaskList
  extends BaseComponent<HTMLDivElement, HTMLElement>
  implements DragTarget
{
  assignedTask: Task[] = [];

  constructor(private type: "ongoing" | "completed") {
    super("tasks-list", "app", "beforeend", `${type}-tasks`);
    this.assignedTask = [];

    this.configure();
    this.renderContent();
  }

  @autobind
  dragOver(event: DragEvent): void {
    if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
      event.preventDefault();
      const listElem = this.newElement.querySelector("ul")!;
      listElem.classList.add("droppable");
    }
  }

  @autobind
  dragLeave(_: DragEvent): void {
    const listElem = this.newElement.querySelector("ul")!;
    listElem.classList.remove("droppable");
  }

  @autobind
  drop(event: DragEvent): void {
    const taskId = event.dataTransfer!.getData("text/plain");

    taskState.moveTask(
      taskId,
      this.type === "ongoing" ? taskStatus.ongoing : taskStatus.completed
    );
  }

  renderContent() {
    const listId = `${this.type}-tasks-list`;
    this.newElement.querySelector("ul")!.id = listId;
    this.newElement.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " TASKS";
  }

  configure(): void {
    //add listeners
    this.newElement.addEventListener("dragover", this.dragOver);
    this.newElement.addEventListener("dragleave", this.dragLeave);
    this.newElement.addEventListener("drop", this.drop);

    // here the list will be changed
    taskState.addListener((tasks: Task[]) => {
      const filteredTask = tasks.filter((task) => {
        if (this.type === "ongoing") {
          return task.status === taskStatus.ongoing;
        }
        return task.status === taskStatus.completed;
      });
      this.assignedTask = filteredTask;
      this.renderList();
    });
  }

  private renderList() {
    const list = document.getElementById(
      `${this.type}-tasks-list`
    )! as HTMLUListElement;

    // re-render the whole list
    list.innerHTML = "";

    for (const taskItem of this.assignedTask) {
      // //Rather than creating a dom element list, we will use class to render
      // const listItem = document.createElement("li");
      // listItem.textContent = taskItem.title;
      // list.appendChild(listItem);

      new TaskItem(this.newElement.querySelector("ul")!.id, taskItem);
    }
  }
}

// base class component for multiple state management
type Listeners<T> = (items: T[]) => void;

class state<T> {
  protected listeners: Listeners<T>[] = [];
  // to listen to changes
  addListener(listenerFn: Listeners<T>) {
    //console.log(listenerFn);
    this.listeners.push(listenerFn);
  }
}

// Global state management for todo list
class TaskStateManagement extends state<Task> {
  private tasks: Task[] = [];
  private static instance: TaskStateManagement;

  // singleton pattern
  private constructor() {
    super();
  }

  addTask(title: string, description: string) {
    const task = new Task(
      Math.floor(Math.random() * 100 + 1),
      title,
      description,
      taskStatus.ongoing
    );
    this.tasks.push(task);
    this.updateListeners();
  }

  moveTask(taskId: string, newStatus: taskStatus) {
    const task = this.tasks.find((task) => task.id.toString() === taskId);
    if (task && task.status !== newStatus) {
      task.status = newStatus;
      this.updateListeners();
    }
  }

  private updateListeners() {
    for (const listenerFn of this.listeners) {
      // copy of array as array are a refernce obj in js
      listenerFn(this.tasks.slice());
    }
  }

  // singleton pattern
  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new TaskStateManagement();
    return this.instance;
  }
}

// To Do Form class
class ToDoForm extends BaseComponent<HTMLDivElement, HTMLFormElement> {
  // form input elements
  titleInput: HTMLInputElement;
  descriptionInput: HTMLInputElement;

  constructor() {
    super("tasks-input", "app", "afterbegin", "user-input");

    // attaching input elemets
    this.titleInput = this.newElement.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descriptionInput = this.newElement.querySelector(
      "#description"
    ) as HTMLInputElement;

    this.configure();
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

      taskState.addTask(title, description);

      this.clearInputs();
    }
  }

  configure() {
    this.newElement.addEventListener("submit", this.onSubmit);
  }

  renderContent(): void {}
}

// instantiate the class

const taskState = TaskStateManagement.getInstance();
const toDoForm = new ToDoForm();
const onGoingList = new TaskList("ongoing");
const completedList = new TaskList("completed");
