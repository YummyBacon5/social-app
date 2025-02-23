import React from 'react'
import {Linking, SafeAreaView, StyleSheet, View} from 'react-native'
import {ScrollView} from './util'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {Text} from '../util/text/Text'
import {Button} from '../util/forms/Button'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isWeb} from 'platform/detection'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {isPossiblyAUrl, splitApexDomain} from 'lib/strings/url-helpers'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'

export const snapPoints = ['50%']

export function Component({text, href}: {text: string; href: string}) {
  const pal = usePalette('default')
  const {closeModal} = useModalControls()
  const {isMobile} = useWebMediaQueries()
  const {_} = useLingui()
  const potentiallyMisleading = isPossiblyAUrl(text)

  const onPressVisit = () => {
    closeModal()
    Linking.openURL(href)
  }

  return (
    <SafeAreaView style={[s.flex1, pal.view]}>
      <ScrollView
        testID="linkWarningModal"
        style={[s.flex1, isMobile && {paddingHorizontal: 18}]}>
        <View style={styles.titleSection}>
          {potentiallyMisleading ? (
            <>
              <FontAwesomeIcon
                icon="circle-exclamation"
                color={pal.colors.text}
                size={18}
              />
              <Text type="title-lg" style={[pal.text, styles.title]}>
                <Trans>Potentially Misleading Link</Trans>
              </Text>
            </>
          ) : (
            <Text type="title-lg" style={[pal.text, styles.title]}>
              <Trans>Leaving Bluesky</Trans>
            </Text>
          )}
        </View>

        <View style={{gap: 10}}>
          <Text type="lg" style={pal.text}>
            <Trans>This link is taking you to the following website:</Trans>
          </Text>

          <LinkBox href={href} />

          {potentiallyMisleading && (
            <Text type="lg" style={pal.text}>
              <Trans>Make sure this is where you intend to go!</Trans>
            </Text>
          )}
        </View>

        <View style={[styles.btnContainer, isMobile && {paddingBottom: 40}]}>
          <Button
            testID="confirmBtn"
            type="primary"
            onPress={onPressVisit}
            accessibilityLabel={_(msg`Visit Site`)}
            accessibilityHint=""
            label="Visit Site"
            labelContainerStyle={{justifyContent: 'center', padding: 4}}
            labelStyle={[s.f18]}
          />
          <Button
            testID="cancelBtn"
            type="default"
            onPress={() => closeModal()}
            accessibilityLabel={_(msg`Cancel`)}
            accessibilityHint=""
            label="Cancel"
            labelContainerStyle={{justifyContent: 'center', padding: 4}}
            labelStyle={[s.f18]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function LinkBox({href}: {href: string}) {
  const pal = usePalette('default')
  const [scheme, hostname, rest] = React.useMemo(() => {
    try {
      const urlp = new URL(href)
      const [subdomain, apexdomain] = splitApexDomain(urlp.hostname)
      return [
        urlp.protocol + '//' + subdomain,
        apexdomain,
        urlp.pathname + urlp.search + urlp.hash,
      ]
    } catch {
      return ['', href, '']
    }
  }, [href])
  return (
    <View style={[pal.view, pal.border, styles.linkBox]}>
      <Text type="lg" style={pal.textLight}>
        {scheme}
        <Text type="lg-bold" style={pal.text}>
          {hostname}
        </Text>
        {rest}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isWeb ? 0 : 40,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: isWeb ? 0 : 4,
    paddingBottom: isWeb ? 14 : 10,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
  linkBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.blue3,
  },
  btnContainer: {
    paddingTop: 20,
    gap: 6,
  },
})
