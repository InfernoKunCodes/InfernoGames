import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { MessageService } from './message.service';
import { CommonDialogComponent } from '../components/common/dialog/common-dialog/common-dialog.component';

describe('MessageService', () => {
  let service: MessageService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    snackBar = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [
        MessageService,
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
      ],
    });
    service = TestBed.inject(MessageService);
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('add opens a snackbar with the message and duration', () => {
    snackBar.open.and.returnValue({} as any);
    service.add('Saved', 1000);
    expect(snackBar.open).toHaveBeenCalled();
    const args = snackBar.open.calls.mostRecent().args;
    expect(args[0]).toBe('Saved');
    expect((args[2] as any).duration).toBe(1000);
  });

  it('snackbar tracks its displayed state until dismissed', () => {
    snackBar.open.and.returnValue({ afterDismissed: () => of(null) } as any);
    service.snackbar('Hello');
    // afterDismissed emits synchronously in the mock, so the flag resets to false.
    expect(service.getSnackBarIsDisplayed).toBeFalse();
  });

  it('dialog opens the common dialog component', () => {
    dialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
    service.dialog('Oops', 'Something broke');
    expect(dialog.open).toHaveBeenCalledWith(CommonDialogComponent, jasmine.any(Object));
  });

  it('dialogAreYouSure returns the afterClosed stream', (done) => {
    dialog.open.and.returnValue({ afterClosed: () => of(true) } as any);
    service.dialogAreYouSure().subscribe((result) => {
      expect(result).toBeTrue();
      done();
    });
  });
});
