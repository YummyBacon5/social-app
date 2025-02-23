import React, {useCallback} from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {AppBskyGraphDefs as GraphDefs} from '@atproto/api'
import {Text} from '../util/text/Text'
import {UserAvatar} from '../util/UserAvatar'
import {MyLists} from '../lists/MyLists'
import {Button} from '../util/forms/Button'
import * as Toast from '../util/Toast'
import {sanitizeDisplayName} from 'lib/strings/display-names'
import {sanitizeHandle} from 'lib/strings/handles'
import {s} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb, isAndroid} from 'platform/detection'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {
  useDangerousListMembershipsQuery,
  getMembership,
  ListMembersip,
  useListMembershipAddMutation,
  useListMembershipRemoveMutation,
} from '#/state/queries/list-memberships'
import {cleanError} from '#/lib/strings/errors'
import {useSession} from '#/state/session'

export const snapPoints = ['fullscreen']

export function Component({
  subject,
  displayName,
  onAdd,
  onRemove,
}: {
  subject: string
  displayName: string
  onAdd?: (listUri: string) => void
  onRemove?: (listUri: string) => void
}) {
  const {closeModal} = useModalControls()
  const pal = usePalette('default')
  const {_} = useLingui()
  const {data: memberships} = useDangerousListMembershipsQuery()

  const onPressDone = useCallback(() => {
    closeModal()
  }, [closeModal])

  return (
    <View testID="userAddRemoveListsModal" style={s.hContentRegion}>
      <Text style={[styles.title, pal.text]}>
        <Trans>Update {displayName} in Lists</Trans>
      </Text>
      <MyLists
        filter="all"
        inline
        renderItem={(list, index) => (
          <ListItem
            index={index}
            list={list}
            memberships={memberships}
            subject={subject}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        )}
        style={[styles.list, pal.border]}
      />
      <View style={[styles.btns, pal.border]}>
        <Button
          testID="doneBtn"
          type="default"
          onPress={onPressDone}
          style={styles.footerBtn}
          accessibilityLabel={_(msg`Done`)}
          accessibilityHint=""
          onAccessibilityEscape={onPressDone}
          label="Done"
        />
      </View>
    </View>
  )
}

function ListItem({
  index,
  list,
  memberships,
  subject,
  onAdd,
  onRemove,
}: {
  index: number
  list: GraphDefs.ListView
  memberships: ListMembersip[] | undefined
  subject: string
  onAdd?: (listUri: string) => void
  onRemove?: (listUri: string) => void
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const {currentAccount} = useSession()
  const [isProcessing, setIsProcessing] = React.useState(false)
  const membership = React.useMemo(
    () => getMembership(memberships, list.uri, subject),
    [memberships, list.uri, subject],
  )
  const listMembershipAddMutation = useListMembershipAddMutation()
  const listMembershipRemoveMutation = useListMembershipRemoveMutation()

  const onToggleMembership = useCallback(async () => {
    if (typeof membership === 'undefined') {
      return
    }
    setIsProcessing(true)
    try {
      if (membership === false) {
        await listMembershipAddMutation.mutateAsync({
          listUri: list.uri,
          actorDid: subject,
        })
        Toast.show(_(msg`Added to list`))
        onAdd?.(list.uri)
      } else {
        await listMembershipRemoveMutation.mutateAsync({
          listUri: list.uri,
          actorDid: subject,
          membershipUri: membership,
        })
        Toast.show(_(msg`Removed from list`))
        onRemove?.(list.uri)
      }
    } catch (e) {
      Toast.show(cleanError(e))
    } finally {
      setIsProcessing(false)
    }
  }, [
    _,
    list,
    subject,
    membership,
    setIsProcessing,
    onAdd,
    onRemove,
    listMembershipAddMutation,
    listMembershipRemoveMutation,
  ])

  return (
    <View
      testID={`toggleBtn-${list.name}`}
      style={[
        styles.listItem,
        pal.border,
        {
          borderTopWidth: index === 0 ? 0 : 1,
        },
      ]}>
      <View style={styles.listItemAvi}>
        <UserAvatar size={40} avatar={list.avatar} />
      </View>
      <View style={styles.listItemContent}>
        <Text
          type="lg"
          style={[s.bold, pal.text]}
          numberOfLines={1}
          lineHeight={1.2}>
          {sanitizeDisplayName(list.name)}
        </Text>
        <Text type="md" style={[pal.textLight]} numberOfLines={1}>
          {list.purpose === 'app.bsky.graph.defs#curatelist' && 'User list '}
          {list.purpose === 'app.bsky.graph.defs#modlist' && 'Moderation list '}
          by{' '}
          {list.creator.did === currentAccount?.did
            ? 'you'
            : sanitizeHandle(list.creator.handle, '@')}
        </Text>
      </View>
      <View>
        {isProcessing || typeof membership === 'undefined' ? (
          <ActivityIndicator />
        ) : (
          <Button
            testID={`user-${subject}-addBtn`}
            type="default"
            label={membership === false ? _(msg`Add`) : _(msg`Remove`)}
            onPress={onToggleMembership}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: isWeb ? 0 : 16,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 10,
  },
  list: {
    flex: 1,
    borderTopWidth: 1,
  },
  btns: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 10,
    paddingBottom: isAndroid ? 10 : 0,
    borderTopWidth: 1,
  },
  footerBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  listItemAvi: {
    width: 54,
    paddingLeft: 4,
    paddingTop: 8,
    paddingBottom: 10,
  },
  listItemContent: {
    flex: 1,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
  },
  loadingContainer: {
    position: 'absolute',
    top: 10,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
})
