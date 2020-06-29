import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { escapeRegExp } from '../utils/escape-regexp';

@Component({
  selector: 'avn-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true,
    },
  ],
})
export class AutocompleteComponent implements ControlValueAccessor, OnInit, OnDestroy {
  /* --- Options related properties --- */

  private options: string[] = [];
  private options$ = new BehaviorSubject<string[]>(this.options);

  @Input() set items(items: string[]) {
    this.options = items;
    this.options$.next(this.options);
  }
  get items(): string[] {
    return this.options;
  }

  /* --- Input field related properties --- */

  inputValue = '';
  private inputValue$ = new BehaviorSubject<string>(this.inputValue);

  @Input() set value(value: string) {
    this.updateInputValue(value, false);
  }
  get value(): string {
    return this.inputValue;
  }
  @Output() valueChange = new EventEmitter<string>();

  @Input() inputMinLength = 3;

  @Input() isInputDisabled = false;

  @Input() placeholder = '';

  /* ----- Suggestions related properties ----- */

  @Input() highlightTag = 'b';

  suggestions: string[] = [];

  @ViewChildren('suggestionsQueryList') suggestionsQueryList!: QueryList<ElementRef<HTMLElement>>;

  focusedSuggestionIndex = -1;

  shouldDisplaySuggestions = false;

  private subscription!: Subscription;

  /* ----- Control value accessor methods ----- */

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscription = combineLatest([this.options$, this.inputValue$])
      .pipe(
        map(([options, inputValue]) => {
          const valueToLowerCase = inputValue.toLowerCase();
          return options.filter((option) => option.toLowerCase().includes(valueToLowerCase));
        }),
        tap((suggestions) => {
          if (this.focusedSuggestionIndex >= suggestions.length) {
            this.focusedSuggestionIndex = -1;
          }
        }),
      )
      .subscribe((suggestions) => (this.suggestions = suggestions));
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateInputValue(value: string, shouldEmitChange = true): void {
    this.inputValue = value;
    this.inputValue$.next(this.inputValue);
    if (shouldEmitChange) {
      this.valueChange.emit(value);
      this.onChange(value);
    }
  }

  inputValueChanged(value: string): void {
    this.updateInputValue(value);
    this.shouldDisplaySuggestions = value.length >= this.inputMinLength;
  }

  selectSuggestion(value: string): void {
    this.updateInputValue(value);
    this.shouldDisplaySuggestions = false;
    this.focusedSuggestionIndex = -1;
  }

  inputFieldLeaved(): void {
    this.onTouched();
    this.shouldDisplaySuggestions = false;
  }

  onArrowUp(event: Event): void {
    event.preventDefault();
    if (!this.suggestionsQueryList.length) {
      this.shouldDisplaySuggestions = this.inputValue.length >= this.inputMinLength;
      return;
    }
    this.focusedSuggestionIndex = Math.max(0, this.focusedSuggestionIndex - 1);
    this.scrollToFocusedSuggestion();
  }

  onArrowDown(event: Event): void {
    event.preventDefault();
    if (!this.suggestionsQueryList.length) {
      this.shouldDisplaySuggestions = this.inputValue.length >= this.inputMinLength;
      return;
    }
    this.focusedSuggestionIndex = Math.min(this.suggestionsQueryList.length - 1, this.focusedSuggestionIndex + 1);
    this.scrollToFocusedSuggestion();
  }

  onEnter(): void {
    if (!this.suggestionsQueryList.length || this.focusedSuggestionIndex === -1) {
      return;
    }
    this.selectSuggestion(this.suggestions[this.focusedSuggestionIndex]);
  }

  private scrollToFocusedSuggestion(): void {
    this.suggestionsQueryList.toArray()[this.focusedSuggestionIndex].nativeElement.scrollIntoView({ block: 'nearest' });
  }

  trackByOption(index: number, option: string): string {
    return option;
  }

  highlightOption(option: string): string {
    const tag = this.highlightTag;
    return option.replace(new RegExp(escapeRegExp(this.inputValue), 'i'), `<${tag}>$&</${tag}>`);
  }

  /* ---- ControlValueAccessor implementation ---- */

  writeValue(value: string | null): void {
    this.updateInputValue(value || '', false);
    this.changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isInputDisabled = isDisabled;
  }
}
