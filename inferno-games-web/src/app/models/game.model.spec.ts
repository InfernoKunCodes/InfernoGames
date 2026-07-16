import { Game, GameStatus } from './game.model';

describe('Game model', () => {
  it('constructs an empty game when no data is provided', () => {
    const game = new Game();
    expect(game.id).toBeUndefined();
    expect(game.title).toBeUndefined();
  });

  it('maps scalar fields from server data', () => {
    const game = new Game({ id: 1, title: 'Halo', rating: 9, developer: 'Bungie' });
    expect(game.id).toBe(1);
    expect(game.title).toBe('Halo');
    expect(game.rating).toBe(9);
    expect(game.developer).toBe('Bungie');
  });

  it('applies sensible defaults for collections and flags', () => {
    const game = new Game({ id: 2, title: 'No Extras' });
    expect(game.genres).toEqual([]);
    expect(game.platforms).toEqual([]);
    expect(game.screenshotUrls).toEqual([]);
    expect(game.favorite).toBeFalse();
    expect(game.dlc).toBeFalse();
    expect(game.playtimeHours).toBe(0);
    expect(game.completionPercentage).toBe(0);
    expect(game.status).toBe(GameStatus.NOT_STARTED);
  });

  it('parses date arrays into Date objects', () => {
    const game = new Game({ id: 3, title: 'Dated', releaseDate: [2020, 5, 1, 0, 0, 0] });
    expect(game.releaseDate).toBeInstanceOf(Date);
    expect(game.releaseDate!.getFullYear()).toBe(2020);
    expect(game.releaseDate!.getMonth()).toBe(4); // May (0-indexed)
  });

  it('leaves optional dates undefined when absent', () => {
    const game = new Game({ id: 4, title: 'NoDates' });
    expect(game.startedAt).toBeUndefined();
    expect(game.completedAt).toBeUndefined();
  });

  it('preserves an explicit status', () => {
    const game = new Game({ id: 5, title: 'Playing', status: GameStatus.IN_PROGRESS });
    expect(game.status).toBe(GameStatus.IN_PROGRESS);
  });
});
