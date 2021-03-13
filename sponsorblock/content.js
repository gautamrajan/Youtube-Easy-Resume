! function (e) {
    function t(t) {
        for (var o, r, a = t[0], c = t[1], l = t[2], d = 0, p = []; d < a.length; d++) r = a[d], Object.prototype.hasOwnProperty.call(i, r) && i[r] && p.push(i[r][0]), i[r] = 0;
        for (o in c) Object.prototype.hasOwnProperty.call(c, o) && (e[o] = c[o]);
        for (u && u(t); p.length;) p.shift()();
        return s.push.apply(s, l || []), n()
    }

    function n() {
        for (var e, t = 0; t < s.length; t++) {
            for (var n = s[t], o = !0, a = 1; a < n.length; a++) {
                var c = n[a];
                0 !== i[c] && (o = !1)
            }
            o && (s.splice(t--, 1), e = r(r.s = n[0]))
        }
        return e
    }
    var o = {},
        i = {
            2: 0
        },
        s = [];

    function r(t) {
        if (o[t]) return o[t].exports;
        var n = o[t] = {
            i: t,
            l: !1,
            exports: {}
        };
        return e[t].call(n.exports, n, n.exports, r), n.l = !0, n.exports
    }
    r.m = e, r.c = o, r.d = function (e, t, n) {
        r.o(e, t) || Object.defineProperty(e, t, {
            enumerable: !0,
            get: n
        })
    }, r.r = function (e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }), Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }, r.t = function (e, t) {
        if (1 & t && (e = r(e)), 8 & t) return e;
        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
        var n = Object.create(null);
        if (r.r(n), Object.defineProperty(n, "default", {
                enumerable: !0,
                value: e
            }), 2 & t && "string" != typeof e)
            for (var o in e) r.d(n, o, function (t) {
                return e[t]
            }.bind(null, o));
        return n
    }, r.n = function (e) {
        var t = e && e.__esModule ? function () {
            return e.default
        } : function () {
            return e
        };
        return r.d(t, "a", t), t
    }, r.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }, r.p = "";
    var a = window.webpackJsonp = window.webpackJsonp || [],
        c = a.push.bind(a);
    a.push = t, a = a.slice();
    for (var l = 0; l < a.length; l++) t(a[l]);
    var u = c;
    s.push([11, 0]), n()
}([, , , , , , , function (e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    const o = n(0);
    class i extends o.Component {
        constructor(e) {
            super(e);
            const t = () => this.props.maxCountdownTime ? this.props.maxCountdownTime() : 4;
            this.countdownInterval = null, this.amountOfPreviousNotices = e.amountOfPreviousNotices || 0, this.idSuffix = e.idSuffix || "", this.state = {
                noticeTitle: e.noticeTitle,
                maxCountdownTime: t,
                countdownTime: t(),
                countdownText: null,
                countdownManuallyPaused: !1
            }
        }
        componentDidMount() {
            this.startCountdown()
        }
        render() {
            const e = {
                zIndex: this.props.zIndex || 50 + this.amountOfPreviousNotices
            };
            return o.createElement("table", {
                id: "sponsorSkipNotice" + this.idSuffix,
                className: "sponsorSkipObject sponsorSkipNotice" + (this.props.fadeIn ? " sponsorSkipNoticeFadeIn" : "") + (this.amountOfPreviousNotices > 0 ? " secondSkipNotice" : ""),
                style: e,
                onMouseEnter: () => this.timerMouseEnter(),
                onMouseLeave: () => this.timerMouseLeave()
            }, o.createElement("tbody", null, o.createElement("tr", {
                id: "sponsorSkipNoticeFirstRow" + this.idSuffix
            }, o.createElement("td", null, o.createElement("img", {
                id: "sponsorSkipLogo" + this.idSuffix,
                className: "sponsorSkipLogo sponsorSkipObject",
                src: chrome.extension.getURL("icons/IconSponsorBlocker256px.png")
            }), o.createElement("span", {
                id: "sponsorSkipMessage" + this.idSuffix,
                className: "sponsorSkipMessage sponsorSkipObject"
            }, this.state.noticeTitle)), o.createElement("td", {
                className: "sponsorSkipNoticeRightSection",
                style: {
                    top: "11px"
                }
            }, this.props.timed ? o.createElement("span", {
                id: "sponsorSkipNoticeTimeLeft" + this.idSuffix,
                onClick: () => this.toggleManualPause(),
                className: "sponsorSkipObject sponsorSkipNoticeTimeLeft"
            }, this.state.countdownText || this.state.countdownTime + "s") : "", o.createElement("img", {
                src: chrome.extension.getURL("icons/close.png"),
                className: "sponsorSkipObject sponsorSkipNoticeButton sponsorSkipNoticeCloseButton sponsorSkipNoticeRightButton",
                onClick: () => this.close()
            }))), this.props.children))
        }
        timerMouseEnter() {
            this.state.countdownManuallyPaused || this.pauseCountdown()
        }
        timerMouseLeave() {
            this.state.countdownManuallyPaused || this.startCountdown()
        }
        toggleManualPause() {
            this.setState({
                countdownManuallyPaused: !this.state.countdownManuallyPaused
            }, () => {
                this.state.countdownManuallyPaused ? this.pauseCountdown() : this.startCountdown()
            })
        }
        countdown() {
            if (!this.props.timed) return;
            const e = Math.min(this.state.countdownTime - 1, this.state.maxCountdownTime());
            if (this.props.videoSpeed && this.intervalVideoSpeed != this.props.videoSpeed() && this.setupInterval(), e <= 0) return clearInterval(this.countdownInterval), void this.close();
            if (3 == e) {
                const e = document.getElementById("sponsorSkipNotice" + this.idSuffix);
                e.style.removeProperty("animation"), e.classList.add("sponsorSkipNoticeFadeOut")
            }
            this.setState({
                countdownTime: e
            })
        }
        removeFadeAnimation() {
            const e = document.getElementById("sponsorSkipNotice" + this.idSuffix);
            e.classList.remove("sponsorSkipNoticeFadeOut"), e.style.animation = "none"
        }
        pauseCountdown() {
            this.props.timed && (this.countdownInterval && clearInterval(this.countdownInterval), this.countdownInterval = null, this.setState({
                countdownTime: this.state.maxCountdownTime(),
                countdownText: this.state.countdownManuallyPaused ? chrome.i18n.getMessage("manualPaused") : chrome.i18n.getMessage("paused")
            }), this.removeFadeAnimation())
        }
        startCountdown() {
            this.props.timed && null === this.countdownInterval && (this.setState({
                countdownTime: this.state.maxCountdownTime(),
                countdownText: null
            }), this.setupInterval())
        }
        setupInterval() {
            this.countdownInterval && clearInterval(this.countdownInterval);
            const e = this.props.videoSpeed ? 1e3 / this.props.videoSpeed() : 1e3;
            this.countdownInterval = setInterval(this.countdown.bind(this), e), this.props.videoSpeed && (this.intervalVideoSpeed = this.props.videoSpeed())
        }
        resetCountdown() {
            this.props.timed && (this.setupInterval(), this.setState({
                countdownTime: this.state.maxCountdownTime(),
                countdownText: null
            }), this.removeFadeAnimation())
        }
        close(e) {
            null !== this.countdownInterval && clearInterval(this.countdownInterval), e || this.props.closeListener()
        }
        changeNoticeTitle(e) {
            this.setState({
                noticeTitle: e
            })
        }
        addNoticeInfoMessage(e, t = "") {
            const n = document.getElementById("sponsorTimesInfoMessage" + this.idSuffix);
            null != n && document.getElementById("sponsorSkipNotice" + this.idSuffix).removeChild(n);
            const o = document.getElementById("sponsorTimesInfoMessage" + this.idSuffix + "2");
            null != o && document.getElementById("sponsorSkipNotice" + this.idSuffix).removeChild(o);
            const i = document.createElement("p");
            if (i.id = "sponsorTimesInfoMessage" + this.idSuffix, i.className = "sponsorTimesInfoMessage", i.innerText = e, document.querySelector("#sponsorSkipNotice" + this.idSuffix + " > tbody").insertBefore(i, document.getElementById("sponsorSkipNoticeSpacer" + this.idSuffix)), void 0 !== t) {
                const e = document.createElement("p");
                e.id = "sponsorTimesInfoMessage" + this.idSuffix + "2", e.className = "sponsorTimesInfoMessage", e.innerText = t, document.querySelector("#sponsorSkipNotice" + this.idSuffix + " > tbody").insertBefore(e, document.getElementById("sponsorSkipNoticeSpacer" + this.idSuffix))
            }
        }
    }
    t.default = i
}, function (e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    const o = n(0);
    class i extends o.Component {
        constructor(e) {
            super(e)
        }
        render() {
            const e = {};
            return this.props.onClick && (e.cursor = "pointer", e.textDecoration = "underline"), o.createElement("p", {
                id: "sponsorTimesInfoMessage" + this.props.idSuffix,
                onClick: this.props.onClick,
                style: e,
                className: "sponsorTimesInfoMessage"
            }, this.props.text)
        }
    }
    t.default = i
}, , , function (e, t, n) {
    "use strict";
    var o = this && this.__awaiter || function (e, t, n, o) {
        return new(n || (n = Promise))((function (i, s) {
            function r(e) {
                try {
                    c(o.next(e))
                } catch (e) {
                    s(e)
                }
            }

            function a(e) {
                try {
                    c(o.throw(e))
                } catch (e) {
                    s(e)
                }
            }

            function c(e) {
                var t;
                e.done ? i(e.value) : (t = e.value, t instanceof n ? t : new n((function (e) {
                    e(t)
                }))).then(r, a)
            }
            c((o = o.apply(e, t || [])).next())
        }))
    };
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    const i = n(1),
        s = n(4),
        r = new(n(3).default),
        a = n(9),
        c = n(12),
        l = n(13),
        u = n(19);
    r.wait(() => null !== i.default.config, 5e3, 10).then((function () {
        !r.isFirefox() && i.default.config.invidiousInstances.includes(new URL(document.URL).host) && window.addEventListener("DOMContentLoaded", () => {
            const e = document.getElementsByTagName("head")[0];
            for (const t of r.css) {
                const n = document.createElement("link");
                n.rel = "stylesheet", n.type = "text/css", n.href = chrome.extension.getURL(t), e.appendChild(n)
            }
        })
    }));
    let d = !1,
        p = null,
        m = null;
    const g = [];
    let h, f, y = null,
        v = null,
        S = !1,
        T = [];
    const k = [];
    let C, b, E, x = !1,
        w = null,
        I = !1,
        B = 0,
        N = -1,
        M = !1,
        L = null,
        O = null;
    r.wait(() => null !== i.default.config, 1e3, 1).then(() => q(Z(document.URL)));
    let U = 0,
        R = !0,
        P = [],
        D = !1,
        V = null,
        A = !1;
    const _ = () => ({
        vote: ye,
        dontShowNoticeAgain: ve,
        unskipSponsorTime: ie,
        sponsorTimes: p,
        sponsorTimesSubmitting: P,
        skipNotices: g,
        v: f,
        sponsorVideoID: m,
        reskipSponsorTime: se,
        updatePreviewBar: $,
        onMobileYouTube: b,
        sponsorSubmissionNotice: V,
        resetSponsorSubmissionNotice: Se,
        changeStartSponsorButton: pe,
        previewTime: oe,
        videoInfo: y,
        getRealCurrentTime: le
    });

    function j(e, t, n) {
        switch (e.message) {
            case "update":
                q(Z(document.URL));
                break;
            case "sponsorStart":
                o = n, f = document.querySelector("video"), o({
                    time: f.currentTime
                }), me();
                break;
            case "sponsorDataChanged":
                de();
                break;
            case "isInfoFound":
                n({
                    found: d,
                    sponsorTimes: p
                }), D && null != document.getElementById("sponsorBlockPopupContainer") && he(), D = !0;
                break;
            case "getVideoID":
                n({
                    videoID: m
                });
                break;
            case "getChannelID":
                n({
                    channelID: h
                });
                break;
            case "isChannelWhitelisted":
                n({
                    value: M
                });
                break;
            case "whitelistChange":
                M = e.value, K(m);
                break;
            case "changeStartSponsorButton":
                pe(e.showStartSponsor, e.uploadButtonVisible);
                break;
            case "submitTimes":
                Te()
        }
        var o
    }

    function F(e) {
        for (const t in e) switch (t) {
            case "hideVideoPlayerControls":
            case "hideInfoButtonPlayerControls":
            case "hideDeleteButtonPlayerControls":
                ce()
        }
    }

    function q(e) {
        return o(this, void 0, void 0, (function* () {
            if (m !== e && (m = e, B = 0, N = -1, p = null, U = 0, y = null, M = !1, h = null, null !== L && L.clear(), d = !1, w = null !== w, I = !0, A = !1, e)) {
                if (yield r.wait(() => null !== i.default.config, 5e3, 1),
                        function () {
                            o(this, void 0, void 0, (function* () {
                                const e = yield r.asyncRequestToCustomServer("GET", "https://www.youtube.com/get_video_info?video_id=" + m);
                                if (e.ok) {
                                    const t = decodeURIComponent(e.responseText).match(/player_response=([^&]*)/)[1];
                                    if (!t) return console.error("[SB] Failed at getting video info from YouTube."), void console.error("[SB] Data returned from YouTube: " + e.responseText);
                                    y = JSON.parse(t)
                                }
                            }))
                        }(), i.default.config.checkForUnlistedVideos) {
                    try {
                        yield r.wait(() => !!y, 5e3, 1)
                    } catch (e) {
                        alert(chrome.i18n.getMessage("adblockerIssue") + "\n\n" + chrome.i18n.getMessage("adblockerIssueUnlistedVideosInfo"))
                    }
                    if ((null === (s = null === (n = null === (t = y) || void 0 === t ? void 0 : t.microformat) || void 0 === n ? void 0 : n.playerMicroformatRenderer) || void 0 === s ? void 0 : s.isUnlisted) || (null === (c = null === (a = y) || void 0 === a ? void 0 : a.videoDetails) || void 0 === c ? void 0 : c.isPrivate)) {
                        if (!confirm(chrome.i18n.getMessage("confirmPrivacy"))) return
                    }
                }
                var t, n, s, a, c;
                if (r.wait(() => !!y, 5e3, 10).then(ee), null === L)
                    if (b) {
                        const e = new MutationObserver(H);
                        let t = null;
                        r.wait(() => (t = document.getElementById("player-control-container"), null !== t)).then(() => {
                            e.observe(document.getElementById("player-control-container"), {
                                attributes: !0,
                                childList: !0,
                                subtree: !0
                            })
                        }).catch()
                    } else r.wait(ae).then(G);
                he(), K(e), ce().then(() => {
                    const e = i.default.config.segmentTimes.get(m);
                    null != e && e.length > 0 && e[e.length - 1].segment.length >= 2 ? pe(!0, !0) : null != e && e.length > 0 && e[e.length - 1].segment.length < 2 ? pe(!1, !0) : pe(!0, !1)
                }), P = [], de(), C || ce()
            }
        }))
    }

    function H() {
        if (null !== L) {
            if (document.body.contains(L.container)) {
                const t = document.querySelector(".progress-bar-background");
                return void(null !== t && (e = t, null === document.getElementById("previewbar") && L.updatePosition(e)))
            }
            L.remove(), L = null
        }
        var e;
        G()
    }

    function G() {
        if (null !== L) return;
        const e = [".progress-bar-background", ".ytp-progress-bar-container", ".no-model.cue-range-markers", ".vjs-progress-holder"];
        for (const t of e) {
            const e = document.querySelector(t);
            if (e) {
                L = new c.default(e, b, C), $();
                break
            }
        }
    }

    function W() {
        Ee(), $()
    }

    function Y() {
        null !== v && (clearTimeout(v), v = null)
    }

    function z(e = !1, t, n = !0) {
        var o;
        if (Y(), A) return N = -1, void(B = 0);
        if (f.paused) return;
        if (i.default.config.disableSkipping || M || null === h && i.default.config.forceChannelCheck) return;
        if (J()) return;
        null == t && (t = f.currentTime);
        const a = function (e, t, n) {
            const o = ne(p, t, n),
                i = ne(p, t, n, e, !0, !0),
                s = o.indexOf(Math.min(...i)),
                r = te(p, s),
                a = ne(P, t, n),
                c = ne(P, t, n, e, !1, !1),
                l = a.indexOf(Math.min(...c)),
                u = te(P, l);
            return -1 === l && -1 !== s || o[s] < a[l] ? {
                array: p,
                index: s,
                endIndex: r,
                openNotice: !0
            } : {
                array: P,
                index: l,
                endIndex: u,
                openNotice: !1
            }
        }(t, e, n);
        if (-1 === a.index) return;
        const c = a.array[a.index],
            u = [c.segment[0], a.array[a.endIndex].segment[1]],
            d = u[0] - t,
            y = m;
        let S = [a.array[a.index]];
        if (a.index !== a.endIndex) {
            S = [];
            for (const e of a.array) r.getCategorySelection(e.category).option === s.CategorySkipOption.AutoSkip && e.segment[0] >= u[0] && e.segment[1] <= u[1] && S.push(e)
        }
        if ((null === (o = r.getCategorySelection(c.category)) || void 0 === o ? void 0 : o.option) === s.CategorySkipOption.ShowOverlay && a.array !== P) return;
        const k = () => {
            var e;
            let t = null,
                n = !1,
                o = !0;
            J(y, c) || (f.currentTime >= u[0] && f.currentTime < u[1] && (! function (e, t, n, o) {
                var a;
                const c = (null === (a = r.getCategorySelection(n[0].category)) || void 0 === a ? void 0 : a.option) === s.CategorySkipOption.AutoSkip;
                (c || P.includes(n[0])) && e.currentTime !== t[1] && (e.loop && e.duration > 1 && t[1] >= e.duration - 1 ? e.currentTime = 0 : e.currentTime = t[1]);
                o && (i.default.config.dontShowNotice && c || g.push(new l.default(n, c, _)));
                if (i.default.config.trackViewCount && c) {
                    let e = !1,
                        o = !1;
                    for (const t of n) {
                        const n = p.indexOf(t); - 1 === n || T[n] ? T[n] && (e = !0) : (r.asyncRequestToServer("POST", "/api/viewedVideoSponsorTime?UUID=" + t.UUID), T[n] = !0), -1 === n && (o = !0)
                    }
                    e || o || (i.default.config.minutesSaved = i.default.config.minutesSaved + (t[1] - t[0]) / 60, i.default.config.skipCount = i.default.config.skipCount + 1)
                }
            }(f, u, S, a.openNotice), (null === (e = r.getCategorySelection(c.category)) || void 0 === e ? void 0 : e.option) === s.CategorySkipOption.ManualSkip ? t = u[0] + .001 : (t = u[1], n = !0, o = !1)), z(n, t, o))
        };
        d <= 0 ? k() : v = setTimeout(k, 1e3 * d * (1 / f.playbackRate))
    }

    function J(e, t) {
        const n = Z(document.URL);
        return (n !== (e || m) || !(!t || p && p.includes(t) || P.includes(t))) && (console.error("[SponsorBlock] The videoID recorded when trying to skip is different than what it should be."), console.error("[SponsorBlock] VideoID recorded: " + m + ". Actual VideoID: " + n), q(n), !0)
    }

    function K(e) {
        return o(this, void 0, void 0, (function* () {
            if (f = document.querySelector("video"), null == f) return void setTimeout(() => K(e), 100);
            ! function () {
                let e = document.getElementById("movie_player");
                C && (e = document.getElementById("player-container"));
                if (!k.includes(e)) return e.addEventListener("keydown", be), k.push(e), !0
            }(), x || (x = !0, f.addEventListener("durationchange", W)), S || i.default.config.disableSkipping || (S = !0, w = !1, f.addEventListener("play", () => {
                w = !1, (I || 0 !== f.currentTime) && (I = !1, Ee(), (Math.abs(N - f.currentTime) > .3 || N !== f.currentTime && Date.now() - B > 2e3) && (B = Date.now(), N = f.currentTime, z()))
            }), f.addEventListener("playing", () => {
                (Math.abs(N - f.currentTime) > .3 || N !== f.currentTime && Date.now() - B > 2e3) && (B = Date.now(), N = f.currentTime, z())
            }), f.addEventListener("seeking", () => {
                f.paused || (B = Date.now(), N = f.currentTime, z())
            }), f.addEventListener("ratechange", () => z()), f.addEventListener("videoSpeed_ratechange", () => z()), f.addEventListener("pause", () => {
                N = -1, B = 0, Y()
            }), z());
            let t = !1;
            const n = [];
            for (const e of i.default.config.categorySelections) n.push(e.name);
            let a;
            if (i.default.config.hashPrefix) {
                const t = (yield r.getHash(e, 1)).substr(0, 4);
                a = r.asyncRequestToServer("GET", "/api/skipSegments/" + t, {
                    categories: n
                })
            } else a = r.asyncRequestToServer("GET", "/api/skipSegments", {
                videoID: e,
                categories: n
            });
            a.then(n => o(this, void 0, void 0, (function* () {
                var o, r;
                if (null === (o = n) || void 0 === o ? void 0 : o.ok) {
                    let t = JSON.parse(n.responseText);
                    if (i.default.config.hashPrefix) {
                        if (t = t.filter(t => t.videoID === e), !(t.length > 0)) return void X(e);
                        if (t = t[0].segments, 0 === t.length) return void X(e)
                    }
                    const o = t;
                    if (!o.length) return void console.error("[SponsorBlock] Server returned malformed response: " + JSON.stringify(o));
                    if (d = !0, null !== p)
                        for (let e = 0; e < p.length; e++) null === p[e].UUID && o.push(p[e]);
                    if (p = o, 0 !== i.default.config.minDuration)
                        for (let e = 0; e < p.length; e++) p[e].segment[1] - p[e].segment[0] < i.default.config.minDuration && (p[e].hidden = s.SponsorHideType.MinimumDuration);
                    Q(), T = [], (E == e || null == E && !isNaN(f.duration)) && $(), U = 0
                } else 404 === (null === (r = n) || void 0 === r ? void 0 : r.status) ? X(e) : U < 15 && !t && (t = !0, setTimeout(() => K(e), 5e3 + 15e3 * Math.random() + 5e3 * U), U++)
            })))
        }))
    }

    function X(e) {
        i.default.config.refetchWhenNotFound && (d = !1, r.wait(() => !!y).then(() => {
            var t, n, o;
            const i = null === (o = null === (n = null === (t = y) || void 0 === t ? void 0 : t.microformat) || void 0 === n ? void 0 : n.playerMicroformatRenderer) || void 0 === o ? void 0 : o.uploadDate;
            Date.now() - new Date(i).getTime() < 2592e5 && setTimeout(() => K(e), 3e4 + 9e4 * Math.random())
        }), U = 0)
    }

    function Q() {
        if (!w) {
            let e = -1;
            for (const t of p)
                if (t.segment[0] <= f.currentTime && t.segment[0] > e && t.segment[1] > f.currentTime) {
                    e = t.segment[0];
                    break
                } if (-1 === e)
                for (const t of P)
                    if (t.segment[0] <= f.currentTime && t.segment[0] > e && t.segment[1] > f.currentTime) {
                        e = t.segment[0];
                        break
                    } - 1 !== e ? z(void 0, e) : z()
        }
    }

    function Z(e) {
        e.startsWith("https://www.youtube.com/tv#/") && (e = e.replace("#", ""));
        let t = null;
        try {
            t = new URL(e)
        } catch (t) {
            return console.error("[SB] Unable to parse URL: " + e), !1
        }
        if (i.default.config && i.default.config.invidiousInstances.includes(t.host)) C = !0;
        else if ("m.youtube.com" === t.host) b = !0;
        else if (!["m.youtube.com", "www.youtube.com", "www.youtube-nocookie.com", "music.youtube.com"].includes(t.host)) return i.default.config || r.wait(() => null !== i.default.config).then(() => q(Z(e))), !1;
        if (t.searchParams.has("v") && ["/watch", "/watch/"].includes(t.pathname) || t.pathname.startsWith("/tv/watch")) {
            const e = t.searchParams.get("v");
            return 11 == e.length && e
        }
        if (t.pathname.startsWith("/embed/")) try {
            return t.pathname.substr(7, 11)
        } catch (t) {
            return console.error("[SB] Video ID not valid for " + e), !1
        }
        return !1
    }

    function $() {
        if (null === L) return;
        if (A) return void L.clear();
        if (null === f) return;
        const e = [];
        if (p && p.forEach(t => {
                t.hidden === s.SponsorHideType.Visible && e.push({
                    segment: t.segment,
                    category: t.category,
                    preview: !1
                })
            }), P.forEach(t => {
                e.push({
                    segment: t.segment,
                    category: t.category,
                    preview: !0
                })
            }), L.set(e, f.duration), i.default.config.showTimeWithSkips) {
            ! function (e) {
                if (b || C) return;
                (isNaN(e) || e < 0) && (e = 0);
                const t = document.querySelector(".ytp-time-display.notranslate");
                if (!t) return;
                let n = document.getElementById("sponsorBlockDurationAfterSkips");
                null === n && (n = document.createElement("span"), n.id = "sponsorBlockDurationAfterSkips", n.classList.add("ytp-time-duration"), t.appendChild(n));
                n.innerText = e <= 0 ? "" : " (" + r.getFormattedTime(f.duration - e) + ")"
            }(r.getTimestampsDuration(e.map(({
                segment: e
            }) => e)))
        }
        E = m
    }

    function ee() {
        var e, t;
        if (h = null === (t = null === (e = y) || void 0 === e ? void 0 : e.videoDetails) || void 0 === t ? void 0 : t.channelId, !h) return void(h = null);
        const n = i.default.config.whitelistedChannels;
        null != n && n.includes(h) && (M = !0), i.default.config.forceChannelCheck && p && p.length > 0 && Q()
    }

    function te(e, t, n = !0) {
        var o, i;
        if (-1 == t || (null === (o = r.getCategorySelection(e[t].category)) || void 0 === o ? void 0 : o.option) !== s.CategorySkipOption.AutoSkip) return t;
        let a = t;
        for (let t = 0; t < (null === (i = e) || void 0 === i ? void 0 : i.length); t++) {
            const o = e[t].segment,
                i = e[a].segment[1];
            o[0] <= i && o[1] > i && (!n || e[t].hidden === s.SponsorHideType.Visible) && r.getCategorySelection(e[t].category).option === s.CategorySkipOption.AutoSkip && (a = t)
        }
        return a !== t && (a = te(e, a, n)), a
    }

    function ne(e, t, n, o, i = !1, a = !1) {
        var c;
        if (null === e) return [];
        const l = [];
        for (let u = 0; u < (null === (c = e) || void 0 === c ? void 0 : c.length); u++) !(void 0 === o || n && e[u].segment[0] >= o || t && e[u].segment[0] < o && e[u].segment[1] > o) || i && r.getCategorySelection(e[u].category).option === s.CategorySkipOption.ShowOverlay || a && e[u].hidden !== s.SponsorHideType.Visible || l.push(e[u].segment[0]);
        return l
    }

    function oe(e, t = !0) {
        f.currentTime = e, t && f.paused && f.play()
    }

    function ie(e) {
        null != p && (f.currentTime = e.segment[0] + .001)
    }

    function se(e) {
        f.currentTime = e.segment[1], z(!0, e.segment[1], !1)
    }

    function re(e, t, n, o, i = !1) {
        if (null != document.getElementById(e + "Button")) return !1;
        const s = document.createElement("button");
        s.draggable = i, s.id = e + "Button", s.classList.add("playerButton"), s.classList.add("ytp-button"), s.setAttribute("title", chrome.i18n.getMessage(t)), s.addEventListener("click", () => {
            n()
        });
        const r = document.createElement("img");
        return s.draggable = i, r.id = e + "Image", r.className = "playerButtonImage", r.src = chrome.extension.getURL("icons/" + o), s.appendChild(r), O.prepend(s), !0
    }

    function ae() {
        const e = [".ytp-right-controls", ".player-controls-top", ".vjs-control-bar"];
        for (const t of e) {
            const e = document.querySelectorAll(t);
            if (e && e.length > 0) return e[e.length - 1]
        }
        return !1
    }

    function ce() {
        return o(this, void 0, void 0, (function* () {
            if (!m) return !1;
            const e = yield function () {
                return o(this, void 0, void 0, (function* () {
                    if (b) return;
                    const e = yield r.wait(ae).catch();
                    O = e;
                    let t = !1;
                    return t = re("startSponsor", "sponsorStart", ue, "PlayerStartIconSponsorBlocker256px.png") || t, t = re("info", "openPopup", ge, "PlayerInfoIconSponsorBlocker256px.png") || t, t = re("delete", "clearTimes", fe, "PlayerDeleteIconSponsorBlocker256px.png") || t, t = re("submit", "SubmitTimes", Te, "PlayerUploadIconSponsorBlocker256px.png") || t, t
                }))
            }();
            return e ? (i.default.config.hideVideoPlayerControls || C ? (document.getElementById("startSponsorButton").style.display = "none", document.getElementById("submitButton").style.display = "none") : document.getElementById("startSponsorButton").style.removeProperty("display"), i.default.config.hideInfoButtonPlayerControls || document.URL.includes("/embed/") || C ? document.getElementById("infoButton").style.display = "none" : document.getElementById("infoButton").style.removeProperty("display"), (i.default.config.hideDeleteButtonPlayerControls || C) && (document.getElementById("deleteButton").style.display = "none"), e) : void 0
        }))
    }

    function le() {
        var e, t;
        return "M 18,11 V 7 l -5,5 5,5 v -4 c 3.3,0 6,2.7 6,6 0,3.3 -2.7,6 -6,6 -3.3,0 -6,-2.7 -6,-6 h -2 c 0,4.4 3.6,8 8,8 4.4,0 8,-3.6 8,-8 0,-4.4 -3.6,-8 -8,-8 z" === (null === (t = null === (e = document.querySelector(".ytp-play-button")) || void 0 === e ? void 0 : e.querySelector(".ytp-svg-fill")) || void 0 === t ? void 0 : t.getAttribute("d")) ? f.duration : f.currentTime
    }

    function ue() {
        he(), me(), P.length > 0 && P[P.length - 1].segment.length < 2 ? (P[P.length - 1].segment[1] = le(), P[P.length - 1].segment.sort((e, t) => e > t ? 1 : e < t ? -1 : 0)) : P.push({
            segment: [le()],
            UUID: null,
            category: i.default.config.defaultCategory
        }), i.default.config.segmentTimes.set(m, P), de(!1)
    }

    function de(e = !0) {
        const t = i.default.config.segmentTimes.get(m);
        if (e && null != t) {
            P = [];
            for (const e of t) P.push({
                segment: e.segment,
                UUID: null,
                category: e.category
            })
        }
        $(), null !== f && z(), null !== V && V.update()
    }

    function pe(e, t) {
        return o(this, void 0, void 0, (function* () {
            if (!m || b) return !1;
            const n = !t || i.default.config.hideDeleteButtonPlayerControls || C ? "none" : "unset";
            document.getElementById("deleteButton").style.display = n, e ? (R = !0, document.getElementById("startSponsorImage").src = chrome.extension.getURL("icons/PlayerStartIconSponsorBlocker256px.png"), document.getElementById("startSponsorButton").setAttribute("title", chrome.i18n.getMessage("sponsorStart")), "none" == document.getElementById("startSponsorImage").style.display || !t || i.default.config.hideUploadButtonPlayerControls || C ? t && !C || (document.getElementById("submitButton").style.display = "none") : document.getElementById("submitButton").style.display = "unset") : (R = !1, document.getElementById("startSponsorImage").src = chrome.extension.getURL("icons/PlayerStopIconSponsorBlocker256px.png"), document.getElementById("startSponsorButton").setAttribute("title", chrome.i18n.getMessage("sponsorEND")), document.getElementById("submitButton").style.display = "none")
        }))
    }

    function me() {
        pe(!R, !0)
    }

    function ge() {
        null == document.getElementById("sponsorBlockPopupContainer") && (D = !1, document.getElementById("infoButton").style.display = "none", function (e, t, n) {
            const o = new XMLHttpRequest;
            o.open(e, t, !0), null != n && (o.onreadystatechange = function () {
                n(o, !1)
            }, o.onerror = function () {
                n(o, !0)
            });
            o.send()
        }("GET", chrome.extension.getURL("popup.html"), (function (e) {
            if (4 == e.readyState && 200 == e.status) {
                const t = document.createElement("div");
                t.id = "sponsorBlockPopupContainer";
                let n = e.responseText;
                n = n.replace(/<head>[\S\s]*<\/head>/gi, ""), n = n.replace(/<body/gi, "<div"), n = n.replace(/<\/body/gi, "</div"), t.innerHTML = n;
                const o = document.createElement("div");
                o.innerText = chrome.i18n.getMessage("closePopup"), o.classList.add("smallLink"), o.setAttribute("align", "center"), o.addEventListener("click", he), o.style.color = "var(--yt-spec-text-primary)", t.prepend(o);
                const i = document.querySelectorAll("#secondary");
                let s = null;
                for (let e = 0; e < i.length; e++) null !== i[e].firstElementChild && (s = i[e]);
                null == s && (s = document.getElementById("watch7-sidebar-contents"));
                const r = t.querySelector("#sponsorBlockPopupLogo"),
                    c = t.querySelector("#sbPopupIconSettings"),
                    l = t.querySelector("#sbPopupIconEdit"),
                    u = t.querySelector("#sbPopupIconCheck");
                r.src = chrome.extension.getURL("icons/LogoSponsorBlocker256px.png"), c.src = chrome.extension.getURL("icons/settings.svg"), l.src = chrome.extension.getURL("icons/pencil.svg"), u.src = chrome.extension.getURL("icons/check.svg"), u.src = chrome.extension.getURL("icons/thumb.svg"), s.insertBefore(t, s.firstChild), a.default(j)
            }
        })))
    }

    function he() {
        const e = document.getElementById("sponsorBlockPopupContainer");
        null != e && (e.remove(), document.URL.includes("/embed/") || (document.getElementById("infoButton").style.display = "unset"))
    }

    function fe() {
        he();
        const e = m,
            t = i.default.config.segmentTimes.get(e);
        if (null != t && t.length > 0) {
            const n = chrome.i18n.getMessage("clearThis") + Ce(t) + "\n" + chrome.i18n.getMessage("confirmMSG");
            if (!confirm(n)) return;
            i.default.config.segmentTimes.delete(e), P = [], $(), pe(!0, !1)
        }
    }

    function ye(e, t, n, o) {
        null != o && (o.addVoteButtonInfo.bind(o)(chrome.i18n.getMessage("Loading")), o.setNoticeInfoMessage.bind(o)());
        const s = r.getSponsorIndexFromUUID(p, t);
        if (-1 != s && null !== p[s].UUID) {
            if (0 === e && T[s] || 1 === e && !T[s]) {
                let t = 1;
                0 == e && (t = -1, T[s] = !1), i.default.config.minutesSaved = i.default.config.minutesSaved + t * (p[s].segment[1] - p[s].segment[0]) / 60, i.default.config.skipCount = i.default.config.skipCount + t
            }
            chrome.runtime.sendMessage({
                message: "submitVote",
                type: e,
                UUID: t,
                category: n
            }, (function (i) {
                null != i && null != o && (1 == i.successType || -1 == i.successType && 429 == i.statusCode ? o.afterVote.bind(o)(r.getSponsorTimeFromUUID(p, t), e, n) : -1 == i.successType && (o.setNoticeInfoMessage.bind(o)(r.getErrorMessage(i.statusCode, i.responseText)), o.resetVoteButtonInfo.bind(o)()))
            }))
        }
    }

    function ve() {
        i.default.config.dontShowNotice = !0,
            function () {
                const e = document.getElementsByClassName("sponsorSkipNotice");
                for (let t = 0; t < e.length; t++) e[t].remove()
            }()
    }

    function Se() {
        V = null
    }

    function Te() {
        null === V && (he(), void 0 !== P && P.length > 0 && (V = new u.default(_, ke)))
    }

    function ke() {
        return o(this, void 0, void 0, (function* () {
            document.getElementById("submitImage").src = chrome.extension.getURL("icons/PlayerUploadIconSponsorBlocker256px.png"), document.getElementById("submitButton").style.animation = "rotate 1s 0s infinite";
            for (let e = 0; e < P.length; e++) P[e].segment[1] > f.duration && (P[e].segment[1] = f.duration);
            if (i.default.config.segmentTimes.set(m, P), i.default.config.minDuration > 0)
                for (let e = 0; e < P.length; e++)
                    if (P[e].segment[1] - P[e].segment[0] < i.default.config.minDuration) {
                        const e = chrome.i18n.getMessage("shortCheck") + "\n\n" + Ce(P);
                        if (!confirm(e)) return
                    } const e = yield r.asyncRequestToServer("POST", "/api/skipSegments", {
                videoID: m,
                userID: i.default.config.userID,
                segments: P
            });
            if (200 === e.status) {
                const e = document.getElementById("submitButton");
                e.style.animation = "rotate 1s";
                const t = function () {
                    pe(!0, !1), e.style.animation = "none", e.removeEventListener("animationend", t)
                };
                e.addEventListener("animationend", t), i.default.config.segmentTimes.delete(m), null === p && (p = []), p = p.concat(P), i.default.config.sponsorTimesContributed = i.default.config.sponsorTimesContributed + P.length, i.default.config.submissionCountSinceCategories = i.default.config.submissionCountSinceCategories + 1, P = [], $()
            } else document.getElementById("submitButton").style.animation = "unset", document.getElementById("submitImage").src = chrome.extension.getURL("icons/PlayerUploadFailedIconSponsorBlocker256px.png"), alert(r.getErrorMessage(e.status, e.responseText))
        }))
    }

    function Ce(e) {
        let t = "";
        for (let n = 0; n < e.length; n++)
            for (let o = 0; o < e[n].segment.length; o++) {
                let i = r.getFormattedTime(e[n].segment[o]);
                1 == o ? i = " to " + i : n > 0 && (i = ", " + i), t += i
            }
        return t
    }

    function be(e) {
        const t = e.key,
            n = i.default.config.skipKeybind,
            o = i.default.config.startSponsorKeybind,
            s = i.default.config.submitKeybind;
        switch (t) {
            case n:
                if (g.length > 0) {
                    const e = g[g.length - 1];
                    e.toggleSkip.call(e)
                }
                break;
            case o:
                ue();
                break;
            case s:
                Te()
        }
    }

    function Ee() {
        const e = A;
        A = document.getElementsByClassName("ad-showing").length > 0, e != A && ($(), ce())
    }
    chrome.runtime.onMessage.addListener(j), i.default.configListeners.includes(F) || i.default.configListeners.push(F)
}, function (e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    const o = n(1),
        i = new(n(3).default);
    t.default = class {
        constructor(e, t, n) {
            this.segments = [], this.videoDuration = 0, this.container = document.createElement("ul"), this.container.id = "previewbar", this.parent = e, this.onMobileYouTube = t, this.onInvidious = n, this.updatePosition(e), this.setupHoverText()
        }
        setupHoverText() {
            if (this.onMobileYouTube || this.onInvidious) return;
            this.categoryTooltip = document.createElement("div"), this.categoryTooltip.className = "ytp-tooltip-title sponsorCategoryTooltip";
            const e = document.querySelector(".ytp-tooltip-text-wrapper");
            if (!e || !e.parentElement) return;
            this.tooltipContainer = e.parentElement;
            const t = e.querySelector(".ytp-tooltip-title");
            if (!this.tooltipContainer || !t) return;
            e.insertBefore(this.categoryTooltip, t.nextSibling);
            const n = document.querySelector(".ytp-progress-bar-container");
            if (!n) return;
            let o = !1;
            n.addEventListener("mouseenter", () => {
                o = !0
            }), n.addEventListener("mouseleave", () => {
                o = !1
            }), new MutationObserver(t => {
                if (!o || !this.categoryTooltip || !this.tooltipContainer) return;
                if (1 === t.length && t[0].target.classList.contains("sponsorCategoryTooltip")) return;
                const n = e.querySelectorAll(".ytp-tooltip-text");
                let s = null,
                    r = !1;
                for (const e of n) {
                    e.classList.contains("ytp-tooltip-text-no-title") && (r = !0);
                    const t = e.textContent;
                    if (null !== t && 0 !== t.length && (s = i.getFormattedTimeToSeconds(t), null !== s)) break
                }
                if (null === s) return;
                let a = null,
                    c = 1 / 0;
                for (const e of this.segments)
                    if (e.segment[0] <= s && e.segment[1] > s) {
                        const t = e.segment[1] - e.segment[0];
                        t < c && (c = t, a = e)
                    } null === a && this.tooltipContainer.classList.contains("sponsorCategoryTooltipVisible") ? this.tooltipContainer.classList.remove("sponsorCategoryTooltipVisible") : null !== a && (this.tooltipContainer.classList.add("sponsorCategoryTooltipVisible"), a.preview ? this.categoryTooltip.textContent = chrome.i18n.getMessage("preview") + " " + i.shortCategoryName(a.category) : this.categoryTooltip.textContent = i.shortCategoryName(a.category), this.categoryTooltip.classList.toggle("ytp-tooltip-text-no-title", r))
            }).observe(e, {
                childList: !0,
                subtree: !0
            })
        }
        updatePosition(e) {
            this.parent = e, this.onMobileYouTube && (e.style.backgroundColor = "rgba(255, 255, 255, 0.3)", e.style.opacity = "1", this.container.style.transform = "none"), this.parent.prepend(this.container)
        }
        updateColor(e, t, n) {
            const o = document.querySelectorAll("[data-vs-segment-type=" + e + "]");
            for (const e of o) e.style.backgroundColor = t, e.style.opacity = String(n)
        }
        clear() {
            for (this.videoDuration = 0, this.segments = []; this.container.firstChild;) this.container.removeChild(this.container.firstChild)
        }
        set(e, t) {
            this.clear(), e && (this.segments = e, this.videoDuration = t, this.segments.sort(({
                segment: e
            }, {
                segment: t
            }) => t[1] - t[0] - (e[1] - e[0])).forEach(e => {
                const t = this.createBar(e);
                this.container.appendChild(t)
            }))
        }
        createBar({
            category: e,
            preview: t,
            segment: n
        }) {
            const i = document.createElement("li");
            i.classList.add("previewbar"), i.innerHTML = "&nbsp;";
            const s = (t ? "preview-" : "") + e;
            return i.setAttribute("data-vs-segment-type", s), i.style.backgroundColor = o.default.config.barTypes[s].color, this.onMobileYouTube || (i.style.opacity = o.default.config.barTypes[s].opacity), i.style.position = "absolute", i.style.width = this.timeToPercentage(n[1] - n[0]), i.style.left = this.timeToPercentage(n[0]), i
        }
        remove() {
            this.container.remove(), this.categoryTooltip && (this.categoryTooltip.remove(), this.categoryTooltip = void 0), this.tooltipContainer && (this.tooltipContainer.classList.remove("sponsorCategoryTooltipVisible"), this.tooltipContainer = void 0)
        }
        timeToPercentage(e) {
            return Math.min(100, e / this.videoDuration * 100) + "%"
        }
    }
}, function (e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    const o = n(0),
        i = n(5),
        s = n(18);
    t.default = class {
        constructor(e, t = !1, n) {
            this.skipNoticeRef = o.createRef(), this.segments = e, this.autoSkip = t, this.contentContainer = n;
            let r = document.getElementById("player-container-id") || document.getElementById("movie_player") || document.querySelector("#player-container .video-js");
            if (null == r) {
                const e = document.getElementById("player");
                r = e.firstChild;
                let t = 1;
                for (; !r.classList.contains("html5-video-player") || !r.classList.contains("ytp-embed");) r = e.children[t], t++
            }
            "music.youtube.com" === new URL(document.URL).host && (r = document.querySelector("#main-panel.ytmusic-player-page"));
            const a = document.getElementsByClassName("sponsorSkipNotice").length;
            let c = "";
            for (const e of this.segments) c += e.UUID;
            c += a, this.noticeElement = document.createElement("div"), this.noticeElement.id = "sponsorSkipNoticeContainer" + c, r.prepend(this.noticeElement), i.render(o.createElement(s.default, {
                segments: e,
                autoSkip: t,
                contentContainer: n,
                ref: this.skipNoticeRef,
                closeListener: () => this.close()
            }), this.noticeElement)
        }
        close() {
            i.unmountComponentAtNode(this.noticeElement), this.noticeElement.remove();
            const e = this.contentContainer().skipNotices;
            e.splice(e.indexOf(this), 1)
        }
        toggleSkip() {
            this.skipNoticeRef.current.prepAction(s.SkipNoticeAction.Unskip)
        }
    }
}, , , , , function (e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    const o = n(0),
        i = n(2),
        s = n(1),
        r = n(4),
        a = n(7),
        c = n(8);
    var l;
    ! function (e) {
        e[e.None = 0] = "None", e[e.Upvote = 1] = "Upvote", e[e.Downvote = 2] = "Downvote", e[e.CategoryVote = 3] = "CategoryVote", e[e.Unskip = 4] = "Unskip"
    }(l = t.SkipNoticeAction || (t.SkipNoticeAction = {}));
    class u extends o.Component {
        constructor(e) {
            super(e), this.noticeRef = o.createRef(), this.categoryOptionRef = o.createRef(), this.segments = e.segments, this.autoSkip = e.autoSkip, this.contentContainer = e.contentContainer, this.audio = null;
            const t = chrome.i18n.getMessage(this.segments.length > 1 ? "multipleSegments" : "category_" + this.segments[0].category + "_short") || chrome.i18n.getMessage("category_" + this.segments[0].category);
            let n = t + " " + chrome.i18n.getMessage("skipped");
            this.autoSkip || (n = chrome.i18n.getMessage("skip_category").replace("{0}", t)), this.amountOfPreviousNotices = document.getElementsByClassName("sponsorSkipNotice").length, this.segments.length > 1 && this.segments.sort((e, t) => e.segment[0] - t.segment[0]);
            for (const e of this.segments) this.idSuffix += e.UUID;
            this.idSuffix += this.amountOfPreviousNotices, this.state = {
                noticeTitle: n,
                messages: [],
                messageOnClick: null,
                maxCountdownTime: () => 4,
                countdownTime: 4,
                countdownText: null,
                unskipText: chrome.i18n.getMessage("unskip"),
                unskipCallback: e => this.unskip(e),
                downvoting: !1,
                choosingCategory: !1,
                thanksForVotingText: null,
                actionState: l.None
            }, this.autoSkip || Object.assign(this.state, this.getUnskippedModeInfo(0, chrome.i18n.getMessage("skip")))
        }
        componentDidMount() {
            s.default.config.audioNotificationOnSkip && this.audio && (this.audio.volume = .1 * this.contentContainer().v.volume, this.autoSkip && this.audio.play())
        }
        render() {
            const e = {
                zIndex: 50 + this.amountOfPreviousNotices
            };
            return this.contentContainer().onMobileYouTube && (e.bottom = "4em", e.transform = "scale(0.8) translate(10%, 10%)"), o.createElement(a.default, {
                noticeTitle: this.state.noticeTitle,
                amountOfPreviousNotices: this.amountOfPreviousNotices,
                idSuffix: this.idSuffix,
                fadeIn: !0,
                timed: !0,
                maxCountdownTime: this.state.maxCountdownTime,
                videoSpeed: () => {
                    var e;
                    return null === (e = this.contentContainer().v) || void 0 === e ? void 0 : e.playbackRate
                },
                ref: this.noticeRef,
                closeListener: () => this.closeListener()
            }, s.default.config.audioNotificationOnSkip && o.createElement("audio", {
                ref: e => {
                    this.audio = e
                }
            }, o.createElement("source", {
                src: chrome.extension.getURL("icons/beep.ogg"),
                type: "audio/ogg"
            })), this.getMessageBoxes(), o.createElement("tr", {
                id: "sponsorSkipNoticeSecondRow" + this.idSuffix
            }, this.state.thanksForVotingText ? o.createElement("td", {
                id: "sponsorTimesVoteButtonInfoMessage" + this.idSuffix,
                className: "sponsorTimesInfoMessage sponsorTimesVoteButtonMessage",
                style: {
                    marginRight: "10px"
                }
            }, this.state.thanksForVotingText) : o.createElement("td", {
                id: "sponsorTimesVoteButtonsContainer" + this.idSuffix,
                className: "sponsorTimesVoteButtonsContainer"
            }, o.createElement("img", {
                id: "sponsorTimesDownvoteButtonsContainer" + this.idSuffix,
                className: "sponsorSkipObject voteButton",
                style: {
                    marginRight: "10px"
                },
                src: chrome.extension.getURL("icons/thumbs_up.svg"),
                title: chrome.i18n.getMessage("upvoteButtonInfo"),
                onClick: () => this.prepAction(l.Upvote)
            }), o.createElement("img", {
                id: "sponsorTimesDownvoteButtonsContainer" + this.idSuffix,
                className: "sponsorSkipObject voteButton",
                src: chrome.extension.getURL("icons/thumbs_down.svg"),
                title: chrome.i18n.getMessage("reportButtonInfo"),
                onClick: () => this.adjustDownvotingState(!0)
            })), o.createElement("td", {
                className: "sponsorSkipNoticeUnskipSection"
            }, o.createElement("button", {
                id: "sponsorSkipUnskipButton" + this.idSuffix,
                className: "sponsorSkipObject sponsorSkipNoticeButton",
                style: {
                    marginLeft: "4px"
                },
                onClick: () => this.prepAction(l.Unskip)
            }, this.state.unskipText + " (" + s.default.config.skipKeybind + ")")), this.autoSkip ? o.createElement("td", {
                className: "sponsorSkipNoticeRightSection"
            }, o.createElement("button", {
                className: "sponsorSkipObject sponsorSkipNoticeButton sponsorSkipNoticeRightButton",
                onClick: this.contentContainer().dontShowNoticeAgain
            }, chrome.i18n.getMessage("Hide"))) : ""), this.state.downvoting && o.createElement("tr", {
                id: "sponsorSkipNoticeDownvoteOptionsRow" + this.idSuffix
            }, o.createElement("td", {
                id: "sponsorTimesDownvoteOptionsContainer" + this.idSuffix
            }, o.createElement("button", {
                className: "sponsorSkipObject sponsorSkipNoticeButton",
                onClick: () => this.prepAction(l.Downvote)
            }, chrome.i18n.getMessage("downvoteDescription")), o.createElement("button", {
                className: "sponsorSkipObject sponsorSkipNoticeButton",
                onClick: () => this.openCategoryChooser()
            }, chrome.i18n.getMessage("incorrectCategory")))), this.state.choosingCategory && o.createElement("tr", {
                id: "sponsorSkipNoticeCategoryChooserRow" + this.idSuffix
            }, o.createElement("td", null, o.createElement("select", {
                id: "sponsorTimeCategories" + this.idSuffix,
                className: "sponsorTimeCategories",
                defaultValue: this.segments[0].category,
                ref: this.categoryOptionRef,
                onChange: this.categorySelectionChange.bind(this)
            }, this.getCategoryOptions()), 1 === this.segments.length && o.createElement("button", {
                className: "sponsorSkipObject sponsorSkipNoticeButton",
                onClick: () => this.prepAction(l.CategoryVote)
            }, chrome.i18n.getMessage("submit")))), this.state.actionState !== l.None && o.createElement("tr", {
                id: "sponsorSkipNoticeSubmissionOptionsRow" + this.idSuffix
            }, o.createElement("td", {
                id: "sponsorTimesSubmissionOptionsContainer" + this.idSuffix
            }, this.getSubmissionChooser())))
        }
        getSubmissionChooser() {
            const e = [];
            for (let t = 0; t < this.segments.length; t++) e.push(o.createElement("button", {
                className: "sponsorSkipObject sponsorSkipNoticeButton",
                onClick: () => this.performAction(t),
                key: "submission" + t + this.segments[t].category + this.idSuffix
            }, t + 1 + ". " + chrome.i18n.getMessage("category_" + this.segments[t].category)));
            return e
        }
        prepAction(e) {
            1 === this.segments.length ? this.performAction(0, e) : this.setState({
                actionState: e
            })
        }
        getMessageBoxes() {
            if (0 === this.state.messages.length) return o.createElement("tr", {
                id: "sponsorSkipNoticeSpacer" + this.idSuffix,
                className: "sponsorBlockSpacer"
            });
            const e = [];
            for (let t = 0; t < this.state.messages.length; t++) e.push(o.createElement(c.default, {
                idSuffix: this.idSuffix,
                text: this.state.messages[t],
                onClick: this.state.messageOnClick,
                key: t
            }));
            return e
        }
        performAction(e, t) {
            switch (null != t ? t : this.state.actionState) {
                case l.None:
                    break;
                case l.Upvote:
                    this.contentContainer().vote(1, this.segments[e].UUID, void 0, this);
                    break;
                case l.Downvote:
                    this.contentContainer().vote(0, this.segments[e].UUID, void 0, this);
                    break;
                case l.CategoryVote:
                    this.contentContainer().vote(void 0, this.segments[e].UUID, this.categoryOptionRef.current.value, this);
                    break;
                case l.Unskip:
                    this.state.unskipCallback(e)
            }
            this.setState({
                actionState: l.None
            })
        }
        adjustDownvotingState(e) {
            e || this.clearConfigListener(), this.setState({
                downvoting: e,
                choosingCategory: !1
            })
        }
        clearConfigListener() {
            this.configListener && (s.default.configListeners.splice(s.default.configListeners.indexOf(this.configListener), 1), this.configListener = null)
        }
        openCategoryChooser() {
            this.configListener = () => this.forceUpdate(), s.default.configListeners.push(this.configListener), this.setState({
                choosingCategory: !0,
                downvoting: !1
            }, () => {
                this.segments.length > 1 && this.prepAction(l.CategoryVote)
            })
        }
        getCategoryOptions() {
            const e = [];
            for (const t of s.default.config.categorySelections) e.push(o.createElement("option", {
                value: t.name,
                key: t.name
            }, chrome.i18n.getMessage("category_" + t.name)));
            return e.length < i.categoryList.length && e.push(o.createElement("option", {
                value: "moreCategories",
                key: "moreCategories"
            }, chrome.i18n.getMessage("moreCategories"))), e
        }
        categorySelectionChange(e) {
            if ("moreCategories" === e.target.value) return chrome.runtime.sendMessage({
                message: "openConfig"
            }), void(e.target.value = this.segments[0].category)
        }
        unskip(e) {
            this.contentContainer().unskipSponsorTime(this.segments[e]), this.unskippedMode(e, chrome.i18n.getMessage("reskip"))
        }
        unskippedMode(e, t) {
            this.setState(this.getUnskippedModeInfo(e, t), () => {
                this.noticeRef.current.resetCountdown()
            })
        }
        getUnskippedModeInfo(e, t) {
            const n = () => {
                const t = this.segments[e],
                    n = Math.round((t.segment[1] - this.contentContainer().v.currentTime) * (1 / this.contentContainer().v.playbackRate));
                return Math.max(n, 4)
            };
            return {
                unskipText: t,
                unskipCallback: e => this.reskip(e),
                maxCountdownTime: n,
                countdownTime: n()
            }
        }
        reskip(e) {
            this.contentContainer().reskipSponsorTime(this.segments[e]);
            const t = {
                unskipText: chrome.i18n.getMessage("unskip"),
                unskipCallback: this.unskip.bind(this),
                maxCountdownTime: () => 4,
                countdownTime: 4
            };
            this.autoSkip || (t.noticeTitle = chrome.i18n.getMessage("noticeTitle")), this.setState(t, () => {
                this.noticeRef.current.resetCountdown()
            })
        }
        afterVote(e, t, n) {
            this.addVoteButtonInfo(chrome.i18n.getMessage("voted")), 0 === t && (this.setNoticeInfoMessage(chrome.i18n.getMessage("hitGoBack")), this.adjustDownvotingState(!1)), e && (0 === t ? e.hidden = r.SponsorHideType.Downvoted : n && (e.category = n), this.contentContainer().updatePreviewBar())
        }
        setNoticeInfoMessageWithOnClick(e, ...t) {
            this.setState({
                messages: t,
                messageOnClick: t => e(t)
            })
        }
        setNoticeInfoMessage(...e) {
            this.setState({
                messages: e
            })
        }
        addVoteButtonInfo(e) {
            this.setState({
                thanksForVotingText: e
            })
        }
        resetVoteButtonInfo() {
            this.setState({
                thanksForVotingText: null
            })
        }
        closeListener() {
            this.clearConfigListener(), this.props.closeListener()
        }
    }
    t.default = u
}, function (e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    const o = n(0),
        i = n(5),
        s = n(20);
    t.default = class {
        constructor(e, t) {
            this.noticeRef = o.createRef(), this.contentContainer = e, this.callback = t;
            let n = document.getElementById("player-container-id") || document.getElementById("movie_player") || document.querySelector("#player-container .video-js");
            if (null == n) {
                const e = document.getElementById("player");
                n = e.firstChild;
                let t = 1;
                for (; !n.classList.contains("html5-video-player") || !n.classList.contains("ytp-embed");) n = e.children[t], t++
            }
            this.noticeElement = document.createElement("div"), this.noticeElement.id = "submissionNoticeContainer", n.prepend(this.noticeElement), i.render(o.createElement(s.default, {
                contentContainer: e,
                callback: t,
                ref: this.noticeRef,
                closeListener: () => this.close()
            }), this.noticeElement)
        }
        update() {
            this.noticeRef.current.forceUpdate()
        }
        close() {
            i.unmountComponentAtNode(this.noticeElement), this.noticeElement.remove()
        }
    }
}, function (e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    const o = n(0),
        i = n(1),
        s = n(7),
        r = n(8),
        a = n(21);
    class c extends o.Component {
        constructor(e) {
            super(e), this.noticeRef = o.createRef(), this.contentContainer = e.contentContainer, this.callback = e.callback;
            const t = chrome.i18n.getMessage("confirmNoticeTitle");
            this.state = {
                noticeTitle: t,
                messages: [],
                idSuffix: "SubmissionNotice"
            }
        }
        componentDidMount() {
            this.videoObserver = new MutationObserver(() => {
                this.forceUpdate()
            }), this.videoObserver.observe(this.contentContainer().v, {
                attributes: !0
            })
        }
        componentWillUnmount() {
            this.videoObserver && this.videoObserver.disconnect()
        }
        render() {
            return o.createElement(s.default, {
                noticeTitle: this.state.noticeTitle,
                idSuffix: this.state.idSuffix,
                ref: this.noticeRef,
                closeListener: this.cancel.bind(this),
                zIndex: 5e4
            }, this.getMessageBoxes(), o.createElement("tr", {
                id: "sponsorSkipNoticeMiddleRow" + this.state.idSuffix,
                className: "sponsorTimeMessagesRow",
                style: {
                    maxHeight: this.contentContainer().v.offsetHeight - 200 + "px"
                }
            }, o.createElement("td", {
                style: {
                    width: "100%"
                }
            }, this.getSponsorTimeMessages())), o.createElement("tr", {
                id: "sponsorSkipNoticeSecondRow" + this.state.idSuffix
            }, o.createElement("td", {
                className: "sponsorSkipNoticeRightSection",
                style: {
                    position: "relative"
                }
            }, o.createElement("button", {
                className: "sponsorSkipObject sponsorSkipNoticeButton sponsorSkipNoticeRightButton",
                onClick: () => window.open("https://github.com/ajayyy/SponsorBlock/wiki/Guidelines")
            }, chrome.i18n.getMessage(i.default.config.submissionCountSinceCategories > 3 ? "guidelines" : "readTheGuidelines")), o.createElement("button", {
                className: "sponsorSkipObject sponsorSkipNoticeButton sponsorSkipNoticeRightButton",
                onClick: this.submit.bind(this)
            }, chrome.i18n.getMessage("submit")))))
        }
        getSponsorTimeMessages() {
            const e = [];
            this.timeEditRefs = [];
            const t = this.props.contentContainer().sponsorTimesSubmitting;
            for (let n = 0; n < t.length; n++) {
                const t = o.createRef();
                e.push(o.createElement(a.default, {
                    key: n,
                    idSuffix: this.state.idSuffix + n,
                    index: n,
                    contentContainer: this.props.contentContainer,
                    submissionNotice: this,
                    ref: t
                })), this.timeEditRefs.push(t)
            }
            return e
        }
        getMessageBoxes() {
            const e = [];
            for (let t = 0; t < this.state.messages.length; t++) e.push(o.createElement(r.default, {
                idSuffix: this.state.idSuffix + t,
                text: this.state.messages[t],
                key: t
            }));
            return e
        }
        cancel() {
            this.noticeRef.current.close(!0), this.contentContainer().resetSponsorSubmissionNotice(), this.props.closeListener()
        }
        submit() {
            var e, t, n;
            for (const e of this.timeEditRefs) e.current.saveEditTimes();
            const o = this.props.contentContainer().sponsorTimesSubmitting;
            for (const e of o)
                if ("chooseACategory" === e.category) return void alert(chrome.i18n.getMessage("youMustSelectACategory"));
            if ("Music" === (null === (n = null === (t = null === (e = this.contentContainer().videoInfo) || void 0 === e ? void 0 : e.microformat) || void 0 === t ? void 0 : t.playerMicroformatRenderer) || void 0 === n ? void 0 : n.category))
                for (const e of o)
                    if ("sponsor" === e.category) {
                        if (!confirm(chrome.i18n.getMessage("nonMusicCategoryOnMusic"))) return;
                        break
                    } this.props.callback(), this.cancel()
        }
    }
    t.default = c
}, function (e, t, n) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    });
    const o = n(0),
        i = n(1),
        s = n(2),
        r = new(n(3).default);
    class a extends o.Component {
        constructor(e) {
            super(e), this.categoryOptionRef = o.createRef(), this.idSuffix = this.props.idSuffix, this.state = {
                editing: !1,
                sponsorTimeEdits: [null, null]
            }
        }
        componentDidMount() {
            document.getElementById("sponsorTimesContainer" + this.idSuffix).addEventListener("keydown", (function (e) {
                e.stopPropagation()
            })), this.configUpdateListener || (this.configUpdateListener = () => this.configUpdate(), i.default.configListeners.push(this.configUpdate.bind(this)))
        }
        componentWillUnmount() {
            this.configUpdateListener && i.default.configListeners.splice(i.default.configListeners.indexOf(this.configUpdate.bind(this)), 1)
        }
        render() {
            const e = {
                textAlign: "center"
            };
            0 != this.props.index && (e.marginTop = "15px");
            const t = e => {
                e && (e.style.setProperty("color", "black", "important"), e.style.setProperty("text-shadow", "none", "important"))
            };
            let n;
            const i = this.props.contentContainer().sponsorTimesSubmitting[this.props.index],
                s = i.segment;
            return n = this.state.editing ? o.createElement("div", {
                id: "sponsorTimesContainer" + this.idSuffix,
                className: "sponsorTimeDisplay"
            }, o.createElement("span", {
                id: "nowButton0" + this.idSuffix,
                className: "sponsorNowButton",
                onClick: () => this.setTimeToNow(0)
            }, chrome.i18n.getMessage("bracketNow")), o.createElement("input", {
                id: "submittingTime0" + this.idSuffix,
                className: "sponsorTimeEdit sponsorTimeEditInput",
                ref: t,
                type: "text",
                value: this.state.sponsorTimeEdits[0],
                onChange: e => {
                    const t = this.state.sponsorTimeEdits;
                    t[0] = e.target.value, this.setState({
                        sponsorTimeEdits: t
                    }), this.saveEditTimes()
                }
            }), o.createElement("span", null, " " + chrome.i18n.getMessage("to") + " "), o.createElement("input", {
                id: "submittingTime1" + this.idSuffix,
                className: "sponsorTimeEdit sponsorTimeEditInput",
                ref: t,
                type: "text",
                value: this.state.sponsorTimeEdits[1],
                onChange: e => {
                    const t = this.state.sponsorTimeEdits;
                    t[1] = e.target.value, this.setState({
                        sponsorTimeEdits: t
                    }), this.saveEditTimes()
                }
            }), o.createElement("span", {
                id: "nowButton1" + this.idSuffix,
                className: "sponsorNowButton",
                onClick: () => this.setTimeToNow(1)
            }, chrome.i18n.getMessage("bracketNow")), o.createElement("span", {
                id: "endButton" + this.idSuffix,
                className: "sponsorNowButton",
                onClick: () => this.setTimeToEnd()
            }, chrome.i18n.getMessage("bracketEnd"))) : o.createElement("div", {
                id: "sponsorTimesContainer" + this.idSuffix,
                className: "sponsorTimeDisplay",
                onClick: this.toggleEditTime.bind(this)
            }, r.getFormattedTime(s[0], !0) + (isNaN(s[1]) ? "" : " " + chrome.i18n.getMessage("to") + " " + r.getFormattedTime(s[1], !0))), o.createElement("div", {
                style: e
            }, n, o.createElement("div", {
                style: {
                    position: "relative"
                }
            }, o.createElement("select", {
                id: "sponsorTimeCategories" + this.idSuffix,
                className: "sponsorTimeCategories",
                defaultValue: i.category,
                ref: this.categoryOptionRef,
                onChange: this.categorySelectionChange.bind(this)
            }, this.getCategoryOptions()), o.createElement("img", {
                id: "sponsorTimeCategoriesHelpButton" + this.idSuffix,
                className: "helpButton",
                src: chrome.extension.getURL("icons/help.svg"),
                title: chrome.i18n.getMessage("categoryGuidelines"),
                onClick: () => chrome.runtime.sendMessage({
                    message: "openConfig"
                })
            })), o.createElement("br", null), o.createElement("span", {
                id: "sponsorTimeDeleteButton" + this.idSuffix,
                className: "sponsorTimeEditButton",
                onClick: this.deleteTime.bind(this)
            }, chrome.i18n.getMessage("delete")), isNaN(s[1]) ? "" : o.createElement("span", {
                id: "sponsorTimePreviewButton" + this.idSuffix,
                className: "sponsorTimeEditButton",
                onClick: this.previewTime.bind(this)
            }, chrome.i18n.getMessage("preview")), isNaN(s[1]) ? "" : o.createElement("span", {
                id: "sponsorTimeInspectButton" + this.idSuffix,
                className: "sponsorTimeEditButton",
                onClick: this.inspectTime.bind(this)
            }, chrome.i18n.getMessage("inspect")), isNaN(s[1]) ? "" : o.createElement("span", {
                id: "sponsorTimeEditButton" + this.idSuffix,
                className: "sponsorTimeEditButton",
                onClick: this.toggleEditTime.bind(this)
            }, this.state.editing ? chrome.i18n.getMessage("save") : chrome.i18n.getMessage("edit")))
        }
        getCategoryOptions() {
            const e = [o.createElement("option", {
                value: "chooseACategory",
                key: "chooseACategory"
            }, chrome.i18n.getMessage("chooseACategory"))];
            for (const t of s.categoryList) e.push(o.createElement("option", {
                value: t,
                key: t
            }, chrome.i18n.getMessage("category_" + t)));
            return e
        }
        categorySelectionChange(e) {
            if (!i.default.config.categorySelections.some(t => t.name === e.target.value)) {
                const t = e.target.value;
                return e.target.value = "chooseACategory", void(confirm(chrome.i18n.getMessage("enableThisCategoryFirst").replace("{0}", chrome.i18n.getMessage("category_" + t))) && chrome.runtime.sendMessage({
                    message: "openConfig"
                }))
            }
            this.saveEditTimes()
        }
        setTimeToNow(e) {
            this.setTimeTo(e, this.props.contentContainer().getRealCurrentTime())
        }
        setTimeToEnd() {
            this.setTimeTo(1, this.props.contentContainer().v.duration)
        }
        setTimeTo(e, t) {
            const n = this.props.contentContainer().sponsorTimesSubmitting[this.props.index];
            n.segment[e] = t, this.setState({
                sponsorTimeEdits: this.getFormattedSponsorTimesEdits(n)
            }, this.saveEditTimes)
        }
        toggleEditTime() {
            if (this.state.editing) this.setState({
                editing: !1
            }), this.saveEditTimes();
            else {
                const e = this.props.contentContainer().sponsorTimesSubmitting[this.props.index];
                this.setState({
                    editing: !0,
                    sponsorTimeEdits: this.getFormattedSponsorTimesEdits(e)
                })
            }
        }
        getFormattedSponsorTimesEdits(e) {
            return [r.getFormattedTime(e.segment[0], !0), r.getFormattedTime(e.segment[1], !0)]
        }
        saveEditTimes() {
            const e = this.props.contentContainer().sponsorTimesSubmitting;
            if (this.state.editing) {
                const t = r.getFormattedTimeToSeconds(this.state.sponsorTimeEdits[0]),
                    n = r.getFormattedTimeToSeconds(this.state.sponsorTimeEdits[1]);
                null !== t && null !== n && (e[this.props.index].segment = [t, n])
            }
            e[this.props.index].category = this.categoryOptionRef.current.value, i.default.config.segmentTimes.set(this.props.contentContainer().sponsorVideoID, e), this.props.contentContainer().updatePreviewBar()
        }
        previewTime() {
            const e = this.props.contentContainer().sponsorTimesSubmitting[this.props.index].segment[0];
            this.props.contentContainer().previewTime(e - 2)
        }
        inspectTime() {
            const e = this.props.contentContainer().sponsorTimesSubmitting[this.props.index].segment[0];
            this.props.contentContainer().previewTime(e + 1e-6, !1)
        }
        deleteTime() {
            const e = this.props.contentContainer().sponsorTimesSubmitting,
                t = this.props.index;
            e[t].segment.length < 2 && this.props.contentContainer().changeStartSponsorButton(!0, !1), e.splice(t, 1), i.default.config.segmentTimes.set(this.props.contentContainer().sponsorVideoID, e), this.props.contentContainer().updatePreviewBar(), 0 == e.length ? (this.props.submissionNotice.cancel(), this.props.contentContainer().changeStartSponsorButton(!0, !1)) : this.props.submissionNotice.forceUpdate()
        }
        configUpdate() {
            this.forceUpdate()
        }
    }
    t.default = a
}]);