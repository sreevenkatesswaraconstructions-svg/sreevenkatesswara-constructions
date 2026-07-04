import '../styles/globals.css'
import 'react-quill/dist/quill.snow.css'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from '../components/Layout'
import { SessionProvider } from 'next-auth/react'

function MyApp({ Component, pageProps, router }) {
  const isAdmin = router.pathname.startsWith('/admin')

  return (
    <SessionProvider session={pageProps.session}>
      {isAdmin ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={router.route}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      ) : (
        <Layout>
          <AnimatePresence mode="wait">
            <motion.div
              key={router.route}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
        </Layout>
      )}
    </SessionProvider>
  )
}

export default MyApp
