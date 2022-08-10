import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

import { escapeRegExp } from '../utils/escape-regexp';

@Component({
  selector: 'avn-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: AutocompleteComponent,
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: AutocompleteComponent,
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  /* --- Items related properties --- */

  private items$ = new BehaviorSubject<string[]>([]);

  @Input() set items(items: string[]) {
    this.items$.next(items);
  }

  get items(): string[] {
    return this.items$.value;
  }

  /* --- Input field related properties --- */

  private value$ = new BehaviorSubject<string>('');

  @Input() set value(value: string) {
    this.value$.next(value);
  }

  get value(): string {
    return this.value$.value;
  }

  @Output() valueChange = new EventEmitter<string>();

  @Input() inputMinLength = 0;

  @Input() isInputDisabled = false;

  @Input() placeholder = '';

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  /* ----- Suggestions related properties ----- */

  @Input() highlightTag = 'b';

  suggestions: string[] = [];

  @ViewChildren('suggestionsQueryList') suggestionsQueryList!: QueryList<ElementRef<HTMLElement>>;

  focusedSuggestionIndex = -1;

  shouldDisplaySuggestions = false;

  private subscription!: Subscription;

  @HostListener('document:click', ['$event']) closeSuggestion(event: Event): void {
    if (event.target === this.inputRef.nativeElement) {
      return;
    }
    const suggestionElements = this.suggestionsQueryList.toArray().map((suggestionRef) => suggestionRef.nativeElement);
    if (suggestionElements.includes(event.target as HTMLElement)) {
      return;
    }
    this.shouldDisplaySuggestions = false;
  }

  /* ----- ControlValueAccessor related methods ----- */

  private controlValueChanged: (value: string) => void = () => undefined;

  controlValueTouched: () => void = () => undefined;

  /* ----- */

  constructor(private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscription = combineLatest([this.items$, this.value$])
      .pipe(
        map(([items, value]) => {
          const valueInLowerCase = value.toLowerCase();
          return items.filter((item) => item.toLowerCase().includes(valueInLowerCase));
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

  private dispatchValue(value: string): void {
    this.value$.next(value);
    this.valueChange.emit(value);
    this.controlValueChanged(value);
  }

  onFocus(): void {
    this.shouldDisplaySuggestions = this.inputMinLength === 0;
  }

  onInput(value: string): void {
    this.dispatchValue(value);
    this.shouldDisplaySuggestions = value.length >= this.inputMinLength;
  }

  onArrowUp(event: Event): void {
    event.preventDefault();
    if (!this.suggestionsQueryList.length) {
      this.shouldDisplaySuggestions = this.value$.value.length >= this.inputMinLength;
      return;
    }
    this.focusedSuggestionIndex = Math.max(0, this.focusedSuggestionIndex - 1);
    this.scrollToFocusedSuggestion();
  }

  onArrowDown(event: Event): void {
    event.preventDefault();
    if (!this.suggestionsQueryList.length) {
      this.shouldDisplaySuggestions = this.value$.value.length >= this.inputMinLength;
      return;
    }
    this.focusedSuggestionIndex = Math.min(this.suggestionsQueryList.length - 1, this.focusedSuggestionIndex + 1);
    this.scrollToFocusedSuggestion();
  }

  onEnter(): void {
    if (
      this.suggestionsQueryList.length === 0 ||
      (this.suggestionsQueryList.length >= 2 && this.focusedSuggestionIndex === -1)
    ) {
      return;
    }
    if (this.suggestionsQueryList.length === 1) {
      this.focusedSuggestionIndex = 0;
    }
    this.selectSuggestion(this.suggestions[this.focusedSuggestionIndex]);
  }

  onEscape(): void {
    this.shouldDisplaySuggestions = false;
  }

  selectSuggestion(value: string): void {
    this.dispatchValue(value);
    this.shouldDisplaySuggestions = false;
    this.focusedSuggestionIndex = -1;
  }

  private scrollToFocusedSuggestion(): void {
    this.suggestionsQueryList.toArray()[this.focusedSuggestionIndex].nativeElement.scrollIntoView({ block: 'nearest' });
  }

  trackBySuggestion(_: number, suggestion: string): string {
    return suggestion;
  }

  highlightSuggestion(suggestion: string): string {
    const tag = this.highlightTag;
    return suggestion.replace(new RegExp(escapeRegExp(this.value$.value), 'i'), `<${tag}>$&</${tag}>`);
  }

  /* ---- ControlValueAccessor implementation ---- */

  writeValue(value: string | null): void {
    this.value$.next(value || '');
    this.changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.controlValueChanged = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.controlValueTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isInputDisabled = isDisabled;
  }

  /* ---- Validator implementation ---- */

  validate(control: AbstractControl): ValidationErrors {
    return !control.value || this.items?.includes(control.value) ? null : { autocomplete: true };
  }
}
