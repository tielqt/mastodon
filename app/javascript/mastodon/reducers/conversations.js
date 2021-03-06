import { Map as ImmutableMap, List as ImmutableList } from 'immutable';
import {
  CONVERSATIONS_FETCH_REQUEST,
  CONVERSATIONS_FETCH_SUCCESS,
  CONVERSATIONS_FETCH_FAIL,
  CONVERSATIONS_UPDATE,
} from '../actions/conversations';
import compareId from '../compare_id';

const initialState = ImmutableMap({
  items: ImmutableList(),
  isLoading: false,
  hasMore: true,
});

const conversationToMap = item => ImmutableMap({
  id: item.id,
  accounts: ImmutableList(item.accounts.map(a => a.id)),
  last_status: item.last_status.id,
});

const updateConversation = (state, item) => state.update('items', list => {
  const index   = list.findIndex(x => x.get('id') === item.id);
  const newItem = conversationToMap(item);

  if (index === -1) {
    return list.unshift(newItem);
  } else {
    return list.set(index, newItem);
  }
});

const expandNormalizedConversations = (state, conversations, next) => {
  let items = ImmutableList(conversations.map(conversationToMap));

  return state.withMutations(mutable => {
    if (!items.isEmpty()) {
      mutable.update('items', list => {
        list = list.map(oldItem => {
          const newItemIndex = items.findIndex(x => x.get('id') === oldItem.get('id'));

          if (newItemIndex === -1) {
            return oldItem;
          }

          const newItem = items.get(newItemIndex);
          items = items.delete(newItemIndex);

          return newItem;
        });

        list = list.concat(items);

        return list.sortBy(x => x.get('last_status'), (a, b) => compareId(a, b) * -1);
      });
    }

    if (!next) {
      mutable.set('hasMore', false);
    }

    mutable.set('isLoading', false);
  });
};

export default function conversations(state = initialState, action) {
  switch (action.type) {
  case CONVERSATIONS_FETCH_REQUEST:
    return state.set('isLoading', true);
  case CONVERSATIONS_FETCH_FAIL:
    return state.set('isLoading', false);
  case CONVERSATIONS_FETCH_SUCCESS:
    return expandNormalizedConversations(state, action.conversations, action.next);
  case CONVERSATIONS_UPDATE:
    return updateConversation(state, action.conversation);
  default:
    return state;
  }
};
