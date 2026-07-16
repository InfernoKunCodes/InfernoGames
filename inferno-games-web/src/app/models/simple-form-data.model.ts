import { Observable } from 'rxjs';

/** A selectable option for dropdown/radio style questions. */
export interface QuestionOption {
  key: string;
  value: any;
  disabled?: boolean;
}

/** Map of observable streams keyed by a question key, used to feed async form data. */
export type ObservableMap = { [key: string]: Observable<any> };

export interface QuestionBaseOptions<T = any> {
  value?: T;
  key?: string;
  label?: string;
  required?: boolean;
  order?: number;
  controlType?: string;
  type?: string;
  options?: QuestionOption[];
  cb?: Function;
}

/** Base class for a single question rendered by a dynamic form. */
export class QuestionBase<T = any> {
  value: T | undefined;
  key: string;
  label: string;
  required: boolean;
  order: number;
  controlType: string;
  type: string;
  options: QuestionOption[];
  cb: Function;

  constructor(options: QuestionBaseOptions<T> = {}) {
    this.value = options.value;
    this.key = options.key ?? '';
    this.label = options.label ?? '';
    this.required = !!options.required;
    this.order = options.order ?? 1;
    this.controlType = options.controlType ?? '';
    this.type = options.type ?? '';
    this.options = options.options ?? [];
    this.cb = options.cb ?? (() => {});
  }
}

export class DropDownQuestion extends QuestionBase<string> {
  constructor(options: QuestionBaseOptions<string> = {}) {
    super({ ...options, controlType: 'dropdown' });
  }
}

export class RadioQuestion extends QuestionBase<string> {
  constructor(options: QuestionBaseOptions<string> = {}) {
    super({ ...options, controlType: 'radio' });
  }
}

/** A collection of questions that make up a simple dynamic form. */
export class SimpleFormData {
  name: string;
  questions: QuestionBase[] = [];

  constructor(name: string) {
    this.name = name;
  }
}
