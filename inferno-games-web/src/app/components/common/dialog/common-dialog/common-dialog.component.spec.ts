import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonDialogComponent } from './common-dialog.component';

describe('CommonDialogComponent', () => {
  let component: CommonDialogComponent;
  let fixture: ComponentFixture<CommonDialogComponent>;
  const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<CommonDialogComponent>>('MatDialogRef', ['close']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Title',
            isCode: false,
            content: 'body',
            fileType: 'txt',
            isReadOnly: false,
            options: { questions: [], current: 'v1', async: () => {} },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommonDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes the form control from the current option', () => {
    expect(component.formControl.value).toBe('v1');
  });

  it('closes the dialog via the ref', () => {
    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
