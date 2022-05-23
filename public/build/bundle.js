
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\PostList.svelte generated by Svelte v3.48.0 */

    const { console: console_1$1 } = globals;

    function create_fragment$1(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const apiURL = "https://projectpraxe.hasura.app/v1/graphql";

    async function getData(query) {
    	await fetch(apiURL, {
    		method: "POST",
    		headers: {
    			"Content-Type": "application/json",
    			"x-hasura-admin-secret": "T6wpZtqF9sVk41BQRkVyaw1AB1L2c4l01bqF752qB2w0QQWnSKLy2di75UjU86fQ"
    		},
    		body: JSON.stringify({ query })
    	}).then(response => response.json()).then(data => console.log(data));
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PostList', slots, []);

    	getData(`
        query {
            DlouhaOsa {
                Cena
                Delka
                Hmotnost
                id
            }
            Jednorucka {
                Cena
                Delka
                Hmotnost
                id
            }
            Kratasy {
                Barva
                Cena
                Latka
                Velikost
                id
            }
            Mikiny {
                Barva
                Cena
                Latka
                Velikost
                id
            }
            Proteiny {
                Cena
                Mnozstvi
                Prichut
                Prodejce
                ZemeVyroby
                id
                id_protein
            }
            Tricka {
                Barva
                Cena
                Latka
                Velikost
                id
            }
        }
    `);

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<PostList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ apiURL, getData });
    	return [];
    }

    class PostList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let postlist;
    	let t0;
    	let div0;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t1;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let t2;
    	let div2;
    	let button0;
    	let t4;
    	let div1;
    	let a2;
    	let t6;
    	let a3;
    	let t8;
    	let a4;
    	let t10;
    	let a5;
    	let t12;
    	let a6;
    	let t14;
    	let div4;
    	let button1;
    	let t16;
    	let div3;
    	let a7;
    	let t18;
    	let a8;
    	let t20;
    	let div6;
    	let button2;
    	let t22;
    	let div5;
    	let a9;
    	let t24;
    	let a10;
    	let t26;
    	let a11;
    	let t28;
    	let button3;
    	let current;
    	let mounted;
    	let dispose;
    	postlist = new PostList({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(postlist.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t1 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t2 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "Proteiny";
    			t4 = space();
    			div1 = element("div");
    			a2 = element("a");
    			a2.textContent = "Jahodový";
    			t6 = space();
    			a3 = element("a");
    			a3.textContent = "Čokolávý";
    			t8 = space();
    			a4 = element("a");
    			a4.textContent = "Vanilkový";
    			t10 = space();
    			a5 = element("a");
    			a5.textContent = "Banánový";
    			t12 = space();
    			a6 = element("a");
    			a6.textContent = "Kokosový";
    			t14 = space();
    			div4 = element("div");
    			button1 = element("button");
    			button1.textContent = "Činky";
    			t16 = space();
    			div3 = element("div");
    			a7 = element("a");
    			a7.textContent = "Dlouhá Osa";
    			t18 = space();
    			a8 = element("a");
    			a8.textContent = "Jednoručka";
    			t20 = space();
    			div6 = element("div");
    			button2 = element("button");
    			button2.textContent = "Oblečení";
    			t22 = space();
    			div5 = element("div");
    			a9 = element("a");
    			a9.textContent = "Trička";
    			t24 = space();
    			a10 = element("a");
    			a10.textContent = "Kraťasy";
    			t26 = space();
    			a11 = element("a");
    			a11.textContent = "Mikiny";
    			t28 = space();
    			button3 = element("button");
    			button3.textContent = "klikfg";
    			if (!src_url_equal(img0.src, img0_src_value = "fitness.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "id", "logo");
    			set_style(img0, "width", "180px");
    			set_style(img0, "height", "180px");
    			set_style(img0, "margin-left", "43%");
    			attr_dev(img0, "alt", "");
    			add_location(img0, file, 38, 3, 883);
    			attr_dev(a0, "href", "index.html");
    			add_location(a0, file, 37, 2, 858);
    			attr_dev(img1, "class", "account");
    			if (!src_url_equal(img1.src, img1_src_value = "account.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "id", "account");
    			set_style(img1, "width", "70px");
    			set_style(img1, "height", "70px");
    			set_style(img1, "float", "right");
    			attr_dev(img1, "alt", "");
    			add_location(img1, file, 46, 3, 1034);
    			attr_dev(a1, "href", "account.html");
    			add_location(a1, file, 45, 2, 1007);
    			add_location(div0, file, 36, 1, 850);
    			attr_dev(button0, "class", "DlouhaOsa-btn");
    			add_location(button0, file, 57, 2, 1209);
    			attr_dev(a2, "href", "Jahodovy.html");
    			add_location(a2, file, 59, 3, 1294);
    			attr_dev(a3, "href", "Cokoladovy.html");
    			add_location(a3, file, 60, 3, 1334);
    			attr_dev(a4, "href", "Vanilkovy.html");
    			add_location(a4, file, 61, 3, 1376);
    			attr_dev(a5, "href", "Bananovy.html");
    			add_location(a5, file, 62, 3, 1418);
    			attr_dev(a6, "href", "Kokosovy.html");
    			add_location(a6, file, 63, 3, 1458);
    			attr_dev(div1, "class", "DlouhaOsa-content");
    			add_location(div1, file, 58, 2, 1259);
    			attr_dev(div2, "class", "DlouhaOsa");
    			add_location(div2, file, 56, 1, 1183);
    			attr_dev(button1, "class", "Cinky-btn");
    			add_location(button1, file, 68, 2, 1536);
    			attr_dev(a7, "href", "DlouhaOsa.html");
    			add_location(a7, file, 70, 3, 1610);
    			attr_dev(a8, "href", "Jednorucka.html");
    			add_location(a8, file, 71, 3, 1653);
    			attr_dev(div3, "class", "Cinky-content");
    			add_location(div3, file, 69, 2, 1579);
    			attr_dev(div4, "class", "Cinky");
    			add_location(div4, file, 67, 1, 1514);
    			attr_dev(button2, "class", "Obleceni-btn");
    			add_location(button2, file, 76, 2, 1738);
    			attr_dev(a9, "href", "Tricka.html");
    			add_location(a9, file, 78, 3, 1821);
    			attr_dev(a10, "href", "Kratasy.html");
    			add_location(a10, file, 79, 3, 1857);
    			attr_dev(a11, "href", "Mikiny.html");
    			add_location(a11, file, 80, 3, 1895);
    			attr_dev(div5, "class", "Obleceni-content");
    			add_location(div5, file, 77, 2, 1787);
    			attr_dev(div6, "class", "Obleceni");
    			add_location(div6, file, 75, 1, 1713);
    			add_location(button3, file, 83, 1, 1946);
    			attr_dev(main, "class", "svelte-1gkmmlu");
    			add_location(main, file, 34, 0, 828);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(postlist, main, null);
    			append_dev(main, t0);
    			append_dev(main, div0);
    			append_dev(div0, a0);
    			append_dev(a0, img0);
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			append_dev(a1, img1);
    			append_dev(main, t2);
    			append_dev(main, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, a2);
    			append_dev(div1, t6);
    			append_dev(div1, a3);
    			append_dev(div1, t8);
    			append_dev(div1, a4);
    			append_dev(div1, t10);
    			append_dev(div1, a5);
    			append_dev(div1, t12);
    			append_dev(div1, a6);
    			append_dev(main, t14);
    			append_dev(main, div4);
    			append_dev(div4, button1);
    			append_dev(div4, t16);
    			append_dev(div4, div3);
    			append_dev(div3, a7);
    			append_dev(div3, t18);
    			append_dev(div3, a8);
    			append_dev(main, t20);
    			append_dev(main, div6);
    			append_dev(div6, button2);
    			append_dev(div6, t22);
    			append_dev(div6, div5);
    			append_dev(div5, a9);
    			append_dev(div5, t24);
    			append_dev(div5, a10);
    			append_dev(div5, t26);
    			append_dev(div5, a11);
    			append_dev(main, t28);
    			append_dev(main, button3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button3, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postlist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postlist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(postlist);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function CreateUser(Jmeno, Prijmeni, Adresa, Telefon, Email, Vek) {
    	fetch("https://projectpraxe.hasura.app/v1/graphql", {
    		method: 'POST',
    		headers: {
    			"Content-Type": "application/json",
    			"x-hasura-admin-secret": "T6wpZtqF9sVk41BQRkVyaw1AB1L2c4l01bqF752qB2w0QQWnSKLy2di75UjU86fQ"
    		},
    		body: JSON.stringify({
    			"query": `
  mutation CreateUser($Vek: Int!, $Telefon: Int!, $Prijmeni: String!, $Jmeno: String!, $Email: String!, $Adresa: String!) {
    insert_Ucet_one(object: {Vek: $Vek, Telefon: $Telefon, Prijmeni: $Prijmeni, Jmeno: $Jmeno, Email: $Email, Adresa: $Adresa}) {
      id
    }
  }
  `,
    			"variables": {
    				Jmeno,
    				Prijmeni,
    				Adresa,
    				Telefon,
    				Email,
    				Vek
    			}
    		})
    	}).then(response => response.json()).then(data => console.log(data));
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		CreateUser("Phíčus", "brand", "skalka", 78789, "minafnf", 78);
    	};

    	$$self.$capture_state = () => ({ PostList, CreateUser });
    	return [click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
