import { AutocompleteItem } from 'autocomplete';

import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'demo';

  items: (string | AutocompleteItem)[] = ['Hel', 'Hello', { value: 'Hello wor', prefix: '🇺🇸' }, 'Hello world!'];

  formGroup = this.fb.group({
    value: ['', [Validators.required]],
  });

  constructor(private fb: FormBuilder) {}
}
