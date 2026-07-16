import { InfernoGamesHelpers } from './helpers';
import { GameStatus } from '../models/game.model';

describe('InfernoGamesHelpers', () => {
  describe('getPlatformLabel', () => {
    it('maps known platforms to display labels', () => {
      expect(InfernoGamesHelpers.getPlatformLabel('PC')).toBe('PC');
      expect(InfernoGamesHelpers.getPlatformLabel('PLAYSTATION_5')).toBe('PlayStation 5');
      expect(InfernoGamesHelpers.getPlatformLabel('NINTENDO_SWITCH')).toBe('Nintendo Switch');
    });

    it('falls back to Other for unknown platforms', () => {
      expect(InfernoGamesHelpers.getPlatformLabel('UNKNOWN')).toBe('Other');
    });
  });

  describe('getStatusColor', () => {
    it('maps statuses to CSS class names', () => {
      expect(InfernoGamesHelpers.getStatusColor(GameStatus.COMPLETED)).toBe('completed');
      expect(InfernoGamesHelpers.getStatusColor(GameStatus.IN_PROGRESS)).toBe('in-progress');
      expect(InfernoGamesHelpers.getStatusColor(GameStatus.DROPPED)).toBe('dropped');
    });

    it('defaults to not-started for undefined', () => {
      expect(InfernoGamesHelpers.getStatusColor(undefined)).toBe('not-started');
    });
  });

  describe('getStatusLabel', () => {
    it('maps statuses to labels', () => {
      expect(InfernoGamesHelpers.getStatusLabel(GameStatus.IN_PROGRESS)).toBe('Playing');
      expect(InfernoGamesHelpers.getStatusLabel(undefined)).toBe('Backlog');
    });
  });

  describe('getStatusTooltip', () => {
    it('provides a tooltip for each status', () => {
      expect(InfernoGamesHelpers.getStatusTooltip(GameStatus.COMPLETED)).toContain('finished');
      expect(InfernoGamesHelpers.getStatusTooltip(undefined)).toContain('Haven');
    });
  });

  describe('getPlatformIcon', () => {
    it('maps platforms to material icon names', () => {
      expect(InfernoGamesHelpers.getPlatformIcon('PC')).toBe('computer');
      expect(InfernoGamesHelpers.getPlatformIcon('NINTENDO_SWITCH')).toBe('videogame_asset');
      expect(InfernoGamesHelpers.getPlatformIcon('SOMETHING')).toBe('devices');
    });
  });
});
