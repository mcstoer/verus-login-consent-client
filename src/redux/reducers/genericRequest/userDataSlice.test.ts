import userDataReducer, {detailAdded, detailUpdated, selectDetailById} from './userDataSlice';
import {CredentialJson} from 'verus-typescript-primitives';
import {RootState} from '#/redux/store';

describe('userDataSlice', () => {
  const mockCredentialJson: CredentialJson = {
    version: 1,
    flags: 0,
    credentialkey: 'iHh1FFVvcNb2mcBudD11umfKJXHbBbH6Sj',
    credential: ['username', 'password'],
    scopes: ['i4W4v6faBEcnD4TzJD68LyEMRhs6jivFdv'],
    label: '',
  };

  describe('reducer', () => {
    it('should return the initial state', () => {
      const state = userDataReducer(undefined, {type: 'unknown'});
      expect(state).toEqual({
        ids: [],
        entities: {},
      });
    });

    it('should handle detailAdded', () => {
      const initialState = userDataReducer(undefined, {type: 'unknown'});
      const payload = {
        index: 0,
        data: [mockCredentialJson],
      };

      const state = userDataReducer(initialState, detailAdded(payload));

      expect(state.ids).toEqual([0]);
      expect(state.entities[0]).toEqual(payload);
    });

    it('should handle multiple detailAdded actions', () => {
      let state = userDataReducer(undefined, {type: 'unknown'});

      state = userDataReducer(
        state,
        detailAdded({
          index: 0,
          data: [mockCredentialJson],
        })
      );

      state = userDataReducer(
        state,
        detailAdded({
          index: 1,
          data: [mockCredentialJson, mockCredentialJson],
        })
      );

      expect(state.ids).toEqual([0, 1]);
      expect(state.entities[0]?.data.length).toBe(1);
      expect(state.entities[1]?.data.length).toBe(2);
    });

    it('should handle detailUpdated', () => {
      let state = userDataReducer(undefined, {type: 'unknown'});

      state = userDataReducer(
        state,
        detailAdded({
          index: 0,
          data: [mockCredentialJson],
        })
      );

      const updatedCredential: CredentialJson = {
        ...mockCredentialJson,
        label: 'updated',
      };

      state = userDataReducer(
        state,
        detailUpdated({
          id: 0,
          changes: {
            data: [updatedCredential],
          },
        })
      );

      expect(state.entities[0]?.data[0].label).toBe('updated');
    });
  });

  describe('selectors', () => {
    it('should select detail by id', () => {
      const payload = {
        index: 0,
        data: [mockCredentialJson],
      };

      let state = userDataReducer(undefined, {type: 'unknown'});
      state = userDataReducer(state, detailAdded(payload));

      const mockRootState: RootState = {
        genericRequest: {
          userData: state,
          authDetails: {ids: [], entities: {}},
        },
      } as unknown as RootState;

      const selected = selectDetailById(mockRootState, 0);

      expect(selected).toEqual(payload);
      expect(selected?.data).toEqual([mockCredentialJson]);
    });

    it('should return undefined for non-existent id', () => {
      const state = userDataReducer(undefined, {type: 'unknown'});

      const mockRootState: RootState = {
        genericRequest: {
          userData: state,
          authDetails: {ids: [], entities: {}},
        },
      } as unknown as RootState;

      const selected = selectDetailById(mockRootState, 999);

      expect(selected).toBeUndefined();
    });

    it('should handle missing genericRequest state', () => {
      const mockRootState = {} as RootState;

      const selected = selectDetailById(mockRootState, 0);

      expect(selected).toBeUndefined();
    });
  });

  describe('integration - detail index synchronization', () => {
    it('should store and retrieve data using the same index', () => {
      const payload0 = {
        index: 0,
        data: [mockCredentialJson],
      };

      const payload1 = {
        index: 1,
        data: [mockCredentialJson, {...mockCredentialJson, label: 'second'}],
      };

      let state = userDataReducer(undefined, {type: 'unknown'});
      state = userDataReducer(state, detailAdded(payload0));
      state = userDataReducer(state, detailAdded(payload1));

      const mockRootState: RootState = {
        genericRequest: {
          userData: state,
          authDetails: {ids: [], entities: {}},
        },
      } as unknown as RootState;

      const detail0 = selectDetailById(mockRootState, 0);
      const detail1 = selectDetailById(mockRootState, 1);

      expect(detail0?.data.length).toBe(1);
      expect(detail1?.data.length).toBe(2);
      expect(detail1?.data[1].label).toBe('second');
    });

    it('should return undefined when index does not match stored data', () => {
      const payload = {
        index: 0,
        data: [mockCredentialJson],
      };

      let state = userDataReducer(undefined, {type: 'unknown'});
      state = userDataReducer(state, detailAdded(payload));

      const mockRootState: RootState = {
        genericRequest: {
          userData: state,
          authDetails: {ids: [], entities: {}},
        },
      } as unknown as RootState;

      const detail0 = selectDetailById(mockRootState, 0);
      const detail1 = selectDetailById(mockRootState, 1);

      expect(detail0).toBeDefined();
      expect(detail0?.data.length).toBe(1);
      expect(detail1).toBeUndefined();
    });
  });
});
