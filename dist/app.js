"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
class BaseComponent {
    constructor(templateId, toRenderElement, position, newElementId) {
        this.templateElem = document.getElementById(templateId);
        this.toRender = document.getElementById(toRenderElement);
        const importedElem = document.importNode(this.templateElem.content, true);
        this.newElement = importedElem.firstElementChild;
        if (newElementId) {
            this.newElement.id = newElementId;
        }
        this.attach(position);
    }
    attach(atPosition) {
        this.toRender.insertAdjacentElement(atPosition, this.newElement);
    }
}
function autobind(_, _2, descriptor) {
    const originalMethod = descriptor.value;
    const modifiedDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            const toBind = originalMethod.bind(this);
            return toBind;
        },
    };
    return modifiedDescriptor;
}
var taskStatus;
(function (taskStatus) {
    taskStatus[taskStatus["ongoing"] = 0] = "ongoing";
    taskStatus[taskStatus["completed"] = 1] = "completed";
})(taskStatus || (taskStatus = {}));
class Task {
    constructor(id, title, description, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.status = status;
    }
}
class TaskItem extends BaseComponent {
    constructor(toRenderId, task) {
        super("single-tasks", toRenderId, "beforeEnd", task.id.toString());
        this.task = task;
        this.configure();
        this.renderContent();
    }
    dragStart(event) {
        console.log(event);
        event.dataTransfer.setData("text/plain", this.task.id.toString());
        event.dataTransfer.effectAllowed = "move";
    }
    dragEnd(_) {
        console.log("Drag end");
    }
    configure() {
        this.newElement.addEventListener("dragstart", this.dragStart);
        this.newElement.addEventListener("dragend", this.dragEnd);
    }
    renderContent() {
        this.newElement.querySelector("h2").textContent = this.task.title;
        this.newElement.querySelector("p").textContent = this.task.description;
    }
}
__decorate([
    autobind
], TaskItem.prototype, "dragStart", null);
class TaskList extends BaseComponent {
    constructor(type) {
        super("tasks-list", "app", "beforeend", `${type}-tasks`);
        this.type = type;
        this.assignedTask = [];
        this.assignedTask = [];
        this.configure();
        this.renderContent();
    }
    dragOver(event) {
        if (event.dataTransfer && event.dataTransfer.types[0] === "text/plain") {
            event.preventDefault();
            const listElem = this.newElement.querySelector("ul");
            listElem.classList.add("droppable");
        }
    }
    dragLeave(_) {
        const listElem = this.newElement.querySelector("ul");
        listElem.classList.remove("droppable");
    }
    drop(event) {
        const taskId = event.dataTransfer.getData("text/plain");
        taskState.moveTask(taskId, this.type === "ongoing" ? taskStatus.ongoing : taskStatus.completed);
    }
    renderContent() {
        const listId = `${this.type}-tasks-list`;
        this.newElement.querySelector("ul").id = listId;
        this.newElement.querySelector("h2").textContent =
            this.type.toUpperCase() + " TASKS";
    }
    configure() {
        this.newElement.addEventListener("dragover", this.dragOver);
        this.newElement.addEventListener("dragleave", this.dragLeave);
        this.newElement.addEventListener("drop", this.drop);
        taskState.addListener((tasks) => {
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
    renderList() {
        const list = document.getElementById(`${this.type}-tasks-list`);
        list.innerHTML = "";
        for (const taskItem of this.assignedTask) {
            new TaskItem(this.newElement.querySelector("ul").id, taskItem);
        }
    }
}
__decorate([
    autobind
], TaskList.prototype, "dragOver", null);
__decorate([
    autobind
], TaskList.prototype, "dragLeave", null);
__decorate([
    autobind
], TaskList.prototype, "drop", null);
class state {
    constructor() {
        this.listeners = [];
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
}
class TaskStateManagement extends state {
    constructor() {
        super();
        this.tasks = [];
    }
    addTask(title, description) {
        const task = new Task(Math.floor(Math.random() * 100 + 1), title, description, taskStatus.ongoing);
        this.tasks.push(task);
        this.updateListeners();
    }
    moveTask(taskId, newStatus) {
        const task = this.tasks.find((task) => task.id.toString() === taskId);
        if (task && task.status !== newStatus) {
            task.status = newStatus;
            this.updateListeners();
        }
    }
    updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.tasks.slice());
        }
    }
    static getInstance() {
        if (this.instance) {
            return this.instance;
        }
        this.instance = new TaskStateManagement();
        return this.instance;
    }
}
class ToDoForm extends BaseComponent {
    constructor() {
        super("tasks-input", "app", "afterbegin", "user-input");
        this.titleInput = this.newElement.querySelector("#title");
        this.descriptionInput = this.newElement.querySelector("#description");
        this.configure();
    }
    clearInputs() {
        this.titleInput.value = "";
        this.descriptionInput.value = "";
    }
    getUserInput() {
        const itemTitle = this.titleInput.value;
        const itemDescription = this.descriptionInput.value;
        if (itemTitle.trim().length === 0 || itemDescription.trim().length === 0) {
            alert("Invalid input.");
            return;
        }
        else {
            return [itemTitle, itemDescription];
        }
    }
    onSubmit(event) {
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
    renderContent() { }
}
__decorate([
    autobind
], ToDoForm.prototype, "onSubmit", null);
const taskState = TaskStateManagement.getInstance();
const toDoForm = new ToDoForm();
const onGoingList = new TaskList("ongoing");
const completedList = new TaskList("completed");
//# sourceMappingURL=app.js.map