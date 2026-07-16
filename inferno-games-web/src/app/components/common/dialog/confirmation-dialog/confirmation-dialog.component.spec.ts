import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<ConfirmationDialogComponent>>('MatDialogRef', ['close']);

  function configure(data: ConfirmationDialogData) {
    TestBed.resetTestingModule();
    return TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents().then(() => {
      fixture = TestBed.createComponent(ConfirmationDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  }

  beforeEach(async () => {
    await configure({ title: 'Confirm', message: 'Are you sure?' });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('returns the info icon by default', () => {
    expect(component.getHeaderIcon()).toBe('info');
  });

  it('returns the warning icon for destructive actions', async () => {
    await configure({ title: 't', message: 'm', isDestructive: true });
    expect(component.getHeaderIcon()).toBe('warning');
  });

  it('returns the help icon for accent actions', async () => {
    await configure({ title: 't', message: 'm', confirmButtonColor: 'accent' });
    expect(component.getHeaderIcon()).toBe('help');
  });
});
