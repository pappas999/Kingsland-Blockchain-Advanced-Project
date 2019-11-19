<template>
    <section>
        <b-navbar
            toggleable="lg"
            variant="white"
            class="tomo-nav">
            <div class="container container--wide tomo-nav__wrapper">
                <b-navbar-brand :to="{name: 'index'}">
                    <img
                        src="~/assets/img/logo.svg"
                        alt="Kingsland"
                        class="tomo-nav__logo">
                </b-navbar-brand>
                <b-navbar-toggle
                    class="tomo-nav__toggle"
                    target="nav_collapse">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 800 600">
                        <path
                            id="top"
                            d="M300,220 C300,220 520,220 540,220 C740,220 640,540 520,420 C440,340 300,200 300,200"/>
                        <path
                            id="middle"
                            d="M300,320 L540,320"/>
                        <path
                            id="bottom"
                            d="M300,210 C300,210 520,210 540,210 C740,210 640,530 520,410 C440,330 300,190 300,190"
                            transform="translate(480, 320) scale(1, -1) translate(-480, -318) "/>
                    </svg>
                </b-navbar-toggle>

                <b-collapse
                    id="nav_collapse"
                    is-nav>
                    <b-navbar-nav>
                        <b-nav-item
                            :to="{name: 'index'}"
                            :exact="true">Home</b-nav-item>
                        <b-nav-item-dropdown
                            :class="(isTxs) ? 'active' : ''"
                            text="Transactions">
                            <b-dropdown-item :to="{name: 'txs'}">All Transactions</b-dropdown-item>
                        </b-nav-item-dropdown>
                        <b-nav-item-dropdown
                            :class="(isAccounts || isContracts) ? 'active' : ''"
                            text="Accounts">
                            <b-dropdown-item :to="{name: 'accounts'}">All Accounts</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'contracts'}">Verified Contracts</b-dropdown-item>
                        </b-nav-item-dropdown>
                        <b-nav-item-dropdown
                            :class="(isTokens || isTokenTxs) ? 'active' : ''"
                            text="Tokens">
                            <b-dropdown-item :to="{name: 'tokens'}">All Tokens</b-dropdown-item>
                            <b-dropdown-item :to="{name: 'tokentxs'}">Token Transfers</b-dropdown-item>
                        </b-nav-item-dropdown>
                        <b-nav-item :to="{name: 'blocks'}">Blocks</b-nav-item>
                    </b-navbar-nav>
                </b-collapse>
            </div>
        </b-navbar>

        <main
            :class="isHomePage ? 'tomo-body-wrapper--home' : ''"
            class="tomo-body-wrapper">
            <div class="container container--wide">
                <div
                    v-if="! isHomePage"
                    class="row align-items-center tomo-body-wrapper__heading">
                    <b-col sm="5">
                        <breadcrumb/>
                    </b-col>
                    <b-col sm="7">
                        <div class="input-group search-form search-form--mini">
                            <div class="input-group-prepend">
                                <button
                                    class="btn btn-primary search-form__btn"
                                    @click="onGotoRoute"><i class="fa fa-search"/></button>
                            </div>
                            <input
                                v-model="search"
                                type="text"
                                class="form-control search-form__input"
                                placeholder="Search"
                                @keyup.enter="onGotoRoute">
                        </div>
                    </b-col>
                </div>
                <b-row v-else>
                    <b-col
                        lg="8"
                        class="offset-lg-2 offset-2xl-3 col-2xl-6">
                        <div class="input-group search-form">
                            <div class="input-group-prepend">
                                <button
                                    class="btn btn-primary search-form__btn"
                                    @click="onGotoRoute"><i class="tm-search"/></button>
                            </div>
                            <input
                                v-model="search"
                                type="text"
                                class="form-control search-form__input"
                                placeholder="Search Address / TX / Block..."
                                @keyup.enter="onGotoRoute">
                        </div>
                        <div class="tomo-stat d-flex">
                            <div class="tomo-stat__item">
                                <nuxt-link :to="{name: 'accounts'}">
                                    <i
                                        v-if="! stats"
                                        class="tomo-loading"/>
                                    <span v-else>{{ formatNumber(stats.totalAddress) }}&nbsp;Accounts</span>
                                </nuxt-link>
                            </div>
                            <div class="tomo-stat__item">
                                <nuxt-link :to="{name: 'tokens'}">
                                    <i
                                        v-if="! stats"
                                        class="tomo-loading"/>
                                    <span v-else>{{ formatNumber(stats.totalToken) }}&nbsp;Tokens</span>
                                </nuxt-link>
                            </div>
                            <div class="tomo-stat__item">
                                <nuxt-link :to="{name: 'contracts'}">
                                    <i
                                        v-if="! stats"
                                        class="tomo-loading"/>
                                    <span v-else>{{ formatNumber(stats.totalSmartContract) }}&nbsp;Contracts</span>
                                </nuxt-link>
                            </div>
                            <div class="tomo-stat__item">
                                <nuxt-link :to="{name: 'blocks'}">
                                    <i
                                        v-if="! stats"
                                        class="tomo-loading"/>
                                    <span v-else>{{ formatNumber(stats.lastBlock.number + 1) }}&nbsp;Blocks</span>
                                </nuxt-link>
                            </div>
                        </div>
                    </b-col>
                </b-row>
                <nuxt/>
            </div>
        </main>

        <footer class="tomo-footer">
            <div class="container container--wide">
                <div class="row">
                    <b-col
                        md="12"
                        class="text-center">
                        <ul class="list-inline tomo-footer__social">
                            <li class="list-inline-item">
                                <a
                                    href=""
                                    target="_blank">
                                    <i class="fa fa-telegram"/>
                                </a>
                            </li>
                            <li class="list-inline-item">
                                <a
                                    href=""
                                    target="_blank">
                                    <i class="fa fa-facebook"/>
                                </a>
                            </li>
                            <li class="list-inline-item">
                                <a
                                    href=""
                                    target="_blank">
                                    <i class="fa fa-twitter"/>
                                </a>
                            </li>
                            <li class="list-inline-item">
                                <a
                                    href=""
                                    target="_blank">
                                    <i class="fa fa-github"/>
                                </a>
                            </li>
                            <li class="list-inline-item">
                                <a
                                    href=""
                                    target="_blank">
                                    <i class="fa fa-linkedin"/>
                                </a>
                            </li>
                        </ul>
                    </b-col>
                    <b-col
                        md="12"
                        class="tomo-footer__copyright">
                        <p>Kingsland - Running on Kingsland blockchain network</p>
                    </b-col>
                </div>
            </div>
        </footer>

        <register :modal-id="'registerModal'"/>
        <login :modal-id="'loginModal'"/>
    </section>
</template>

<script>
import mixin from '~/plugins/mixin'
import MyFooter from '~/components/Footer.vue'
import Breadcrumb from '~/components/Breadcrumb.vue'
import Register from '~/components/Register.vue'
import Login from '~/components/Login.vue'

export default {
    components: {
        MyFooter,
        Breadcrumb,
        Register,
        Login
    },
    mixins: [mixin],
    data () {
        return {
            search: null,
            stats: null
        }
    },
    computed: {
        user () {
            let user = this.$store.state.user
            return user ? user.data : null
        },
        isTxs () {
            return this.$route.fullPath.startsWith('/txs')
        },
        isAccounts () {
            return this.$route.fullPath.startsWith('/accounts') || this.$route.fullPath.startsWith('/address')
        },
        isContracts () {
            return this.$route.fullPath.startsWith('/contracts')
        },
        isTokens () {
            return this.$route.fullPath.startsWith('/tokens')
        },
        isTokenTxs () {
            return this.$route.fullPath.startsWith('/tokentxs')
        },
        isHomePage () {
            let name = this.$route.name
            return name ? name.indexOf(['index']) >= 0 : false
        }
    },
    watch: {
        $route (to, from) {
            if (this.isHomePage) {
                this.getStats()
            }
        }
    },
    mounted () {
        let self = this

        self.$store.dispatch('user/getCachedUser')

        if (self.isHomePage) {
            self.getStats()
        }
    },
    methods: {

        async onLogout () {
            let self = this

            await self.$store.dispatch('user/logout')

            // Redirect to home page.
            self.$router.replace({ name: 'index' })
        },
        onGotoRoute () {
            let search = this.search.trim()
            let regexpTx = /[0-9a-zA-Z]{66}?/
            let regexpAddr = /^(0x)?[0-9a-fA-F]{40}$/
            let regexpBlock = /[0-9]+?/
            let to = null

            if (regexpAddr.test(search)) {
                to = { name: 'address-slug', params: { slug: search } }
            } else if (regexpTx.test(search)) {
                to = { name: 'txs-slug', params: { slug: search } }
            } else if (regexpBlock.test(search)) {
                to = { name: 'blocks-slug', params: { slug: search } }
            }

            if (!to) {
                return false
            }

            return this.$router.push(to)
        },
        async getStats () {
            let self = this
            let { data } = await self.$axios.get('/api/setting')
            self.stats = data.stats
        }
    }
}
</script>
