import AsyncStorage from '@react-native-async-storage/async-storage'

import {logger} from '#/logger'
import {defaults, Schema} from '#/state/persisted/schema'
import {write, read} from '#/state/persisted/store'

/**
 * The shape of the serialized data from our legacy Mobx store.
 */
type LegacySchema = {
  shell: {
    colorMode: 'system' | 'light' | 'dark'
  }
  session: {
    data: {
      service: string
      did: `did:plc:${string}`
    }
    accounts: {
      service: string
      did: `did:plc:${string}`
      refreshJwt: string
      accessJwt: string
      handle: string
      email: string
      displayName: string
      aviUrl: string
      emailConfirmed: boolean
    }[]
  }
  me: {
    did: `did:plc:${string}`
    handle: string
    displayName: string
    description: string
    avatar: string
  }
  onboarding: {
    step: string
  }
  preferences: {
    primaryLanguage: string
    contentLanguages: string[]
    postLanguage: string
    postLanguageHistory: string[]
    contentLabels: {
      nsfw: string
      nudity: string
      suggestive: string
      gore: string
      hate: string
      spam: string
      impersonation: string
    }
    savedFeeds: string[]
    pinnedFeeds: string[]
    requireAltTextEnabled: boolean
  }
  invitedUsers: {
    seenDids: string[]
    copiedInvites: string[]
  }
  mutedThreads: {uris: string[]}
  reminders: {lastEmailConfirm: string}
}

const DEPRECATED_ROOT_STATE_STORAGE_KEY = 'root'

// TODO remove, assume that partial data may be here during our refactor
export function transform(legacy: Partial<LegacySchema>): Schema {
  return {
    colorMode: legacy.shell?.colorMode || defaults.colorMode,
    session: {
      accounts: legacy.session?.accounts || defaults.session.accounts,
      currentAccount:
        legacy.session?.accounts?.find(
          a => a.did === legacy.session?.data?.did,
        ) || defaults.session.currentAccount,
    },
    reminders: {
      lastEmailConfirm:
        legacy.reminders?.lastEmailConfirm ||
        defaults.reminders.lastEmailConfirm,
    },
    languagePrefs: {
      primaryLanguage:
        legacy.preferences?.primaryLanguage ||
        defaults.languagePrefs.primaryLanguage,
      contentLanguages:
        legacy.preferences?.contentLanguages ||
        defaults.languagePrefs.contentLanguages,
      postLanguage:
        legacy.preferences?.postLanguage || defaults.languagePrefs.postLanguage,
      postLanguageHistory:
        legacy.preferences?.postLanguageHistory ||
        defaults.languagePrefs.postLanguageHistory,
    },
    requireAltTextEnabled:
      legacy.preferences?.requireAltTextEnabled ||
      defaults.requireAltTextEnabled,
    mutedThreads: legacy.mutedThreads?.uris || defaults.mutedThreads,
    invites: {
      copiedInvites:
        legacy.invitedUsers?.copiedInvites || defaults.invites.copiedInvites,
    },
    onboarding: {
      step: legacy.onboarding?.step || defaults.onboarding.step,
    },
  }
}

/**
 * Migrates legacy persisted state to new store if new store doesn't exist in
 * local storage AND old storage exists.
 */
export async function migrate() {
  logger.debug('persisted state: migrate')

  try {
    const rawLegacyData = await AsyncStorage.getItem(
      DEPRECATED_ROOT_STATE_STORAGE_KEY,
    )
    const alreadyMigrated = Boolean(await read())

    if (!alreadyMigrated && rawLegacyData) {
      logger.debug('persisted state: migrating legacy storage')
      const legacyData = JSON.parse(rawLegacyData)
      const newData = transform(legacyData)
      await write(newData)
      logger.debug('persisted state: migrated legacy storage')
    }
  } catch (e) {
    logger.error('persisted state: error migrating legacy storage', {
      error: String(e),
    })
  }
}
