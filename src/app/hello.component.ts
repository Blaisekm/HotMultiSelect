import { Component, Input } from "@angular/core";
import Handsontable from "handsontable";
import { HotTableRegisterer } from "@handsontable/angular";

function tagsRenderer(instance, td, row, column, prop, value, cellProperties) {
  Handsontable.renderers.BaseRenderer(
    instance,
    td,
    row,
    column,
    prop,
    value,
    cellProperties
  );
  Handsontable.dom.empty(td);
  value && td.append(...parseTags(value).map(createRendererTag));
}

const tags = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];

const parseTags = (text) =>
  ((text && text.split(",")) || []).filter((t) => !!t);

const tagsToString = (tags) => (tags && tags.join(",")) || "";

const createRendererTag = (text) =>
  createTag(text, { display: "inline", color: "lightgray" });

const createEditorTag = (text, onRemove) =>
  createTag(text, { display: "inline-block", color: "lightblue", onRemove });

function createTag(text, { display, color, onRemove }) {
  const span = document.createElement("span");
  span.style.cssText = `padding: 0 5px; margin-right: 2px; background: ${color}; border-radius: 1em; white-space: nowrap; display: ${display}; margin-top: 2px`;
  span.textContent = text;
  if (onRemove) {
    const button = document.createElement("button");
    button.textContent = "╳";
    button.className = "remove";
    button.onclick = onRemove;
    span.append(button);
  }
  return span;
}

class TagsEditor extends Handsontable.editors.AutocompleteEditor {
  constructor(props) {
    super(props);
  }

  beginEditing(newInitialValue, event) {
    // clear the input value instead of rendering the existing tags list
    super.beginEditing("", event);
  }
  finishEditing(restoreOriginalValue, ctrlDown, callback) {
    // discard empty input instead of clearing the value
    const value =
      this.htEditor && this.htEditor.getSelectedLast()
        ? this.htEditor.getInstance().getValue()
        : this.getValue();

    super.finishEditing(
      restoreOriginalValue || !value || !value.trim(),
      ctrlDown,
      callback
    );
  }
  saveValue(value, ctrlDown) {
    // merge the input value with the original tags list
    const tags = [...parseTags(this.originalValue), ...parseTags(value[0][0])];
    const uniqueTags = tags.filter((tag, i) => tags.indexOf(tag) == i);
    super.saveValue([[tagsToString(uniqueTags)]], ctrlDown);
  }
  createElements() {
    super.createElements();
    const { rootDocument } = this.hot;
    this.TAGS_CONTAINER = rootDocument.createElement("div");
    this.TAGS_CONTAINER.style.cssText = `background: #eee; padding: 5px; box-shadow:         inset 0 2px 5px rgba(0,0,0,.2); max-height: 3em; overflow-y: auto;`;
    this.TEXTAREA_PARENT.prepend(this.TAGS_CONTAINER);
  }
  open() {
    Handsontable.dom.empty(this.TAGS_CONTAINER);
    const removableTag = (tag) =>
      createEditorTag(tag, () => {
        const { instance, row, col } = this;
        const tags = parseTags(this.originalValue).filter((t) => t != tag);
        instance.setDataAtCell(row, col, tagsToString(tags));
      });
    this.TAGS_CONTAINER.append(
      ...parseTags(this.originalValue).map(removableTag)
    );
    super.open();
  }
  refreshDimensions() {
    super.refreshDimensions();
    this.TAGS_CONTAINER.style.width = this.TEXTAREA.style.width;
  }
  prepare(td, row, col, prop, value, cellProperties) {
    const tags = parseTags(value);

    cellProperties.source = cellProperties.source.filter(
      (t) => !tags.includes(t)
    );
    super.prepare(td, row, col, prop, value, cellProperties);
  }
}

@Component({
  selector: "hello",
  template: `
    <h1>Hello {{ name }}!</h1>
    <hot-table
      [licenseKey]="lickey"
      [hotId]="id"
      [settings]="settings"
    ></hot-table>
  `,
  styles: [
    `
      h1 {
        font-family: Lato;
      }
    `
  ]
})
export class HelloComponent {
  public hotRegisterer = new HotTableRegisterer();
  id = "hotInstance";
  settings = {
    data: Array.from({ length: 100 }).map((o, i) => ({
      id: i,
      name: `Name ${i}`,
      value: Math.floor(1000 * Math.random()),
      start: "6/1/2019",
      tags: tagsToString(tags.filter((s) => Math.random() > 0.5)),
      color: tags[(Math.random() * tags.length) | 0]
    })),
    columns: [
      { data: "id", type: "numeric" },
      { data: "name", type: "text" },
      {
        data: "tags",
        renderer: tagsRenderer,
        editor: TagsEditor,
        source: tags,
        strict: true
      },
      { data: "color", type: "autocomplete", source: tags, strict: true },
      { data: "value", type: "numeric" },
      { data: "start", type: "date", dateFormat: "M/D/YYYY" }
    ],
    colHeaders: ["ID", "Name", "Tags", "Color", "Value", "Start"],
    rowHeaders: true,
    width: 800,
    height: 500,
    allowInvalid: false,
    manualColumnResize: true
  };

  @Input() name: string;
}

const hot = new HelloComponent();

setTimeout(() => {
  hot.hotRegisterer.getInstance(hot.id).setDataAtCell(1, 1, "Sample");
}, 3000);
