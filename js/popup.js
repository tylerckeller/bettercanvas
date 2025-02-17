const syncedSwitches = ['remlogo', 'full_width', 'auto_dark', 'assignments_due', 'gpa_calc', 'gradient_cards', 'disable_color_overlay', 'dashboard_grades', 'dashboard_notes', 'better_todo', 'condensed_cards'];
const syncedSubOptions = ['relative_dues', 'card_overdues', 'todo_overdues', 'gpa_calc_prepend', 'auto_dark', 'auto_dark_start', 'auto_dark_end', 'num_assignments', 'assignment_date_format', 'todo_hr24', 'grade_hover', 'hide_completed', 'num_todo_items', 'hover_preview'];
const localSwitches = ['dark_mode'];

sendFromPopup("getCards");

// refresh the cards if new ones were just recieved
chrome.storage.onChanged.addListener((changes) => {
    if (changes["custom_cards"]) {
        if (Object.keys(changes["custom_cards"].oldValue).length !== Object.keys(changes["custom_cards"].newValue).length) {
            displayAdvancedCards();
        }
    }
})

chrome.storage.sync.get(syncedSubOptions, function (result) {
    document.querySelector('#grade_hover').checked = result.grade_hover;
    document.querySelector('#hide_completed').checked = result.hide_completed;
    document.querySelector('#autodark_start').value = result.auto_dark_start["hour"] + ":" + result.auto_dark_start["minute"];
    document.querySelector('#autodark_end').value = result.auto_dark_end["hour"] + ":" + result.auto_dark_end["minute"];
    document.querySelector('#numAssignmentsSlider').value = result.num_assignments;
    document.querySelector("#numAssignments").textContent = result.num_assignments;
    document.querySelector("#numTodoItems").textContent = result.num_todo_items;
    document.querySelector("#numTodoItemsSlider").value = result.num_todo_items;
    document.querySelector("#assignment_date_format").checked = result.assignment_date_format == true;
    document.querySelector("#todo_hr24").checked = result.todo_hr24 == true;
    document.querySelector('#hover_preview').checked = result.hover_preview;
    document.querySelector('#gpa_calc_prepend').checked = result.gpa_calc_prepend;
    document.querySelector('#card_overdues').checked = result.card_overdues;
    document.querySelector('#todo_overdues').checked = result.todo_overdues;
    document.querySelector('#relative_dues').checked = result.relative_dues;
    toggleDarkModeDisable(result.auto_dark);
});

chrome.storage.local.get(["custom_domain"], storage => {
    document.querySelector("#customDomain").value = storage.custom_domain ? storage.custom_domain : "";
});

document.querySelector('#numAssignmentsSlider').addEventListener('input', function () {
    document.querySelector('#numAssignments').textContent = this.value;
    chrome.storage.sync.set({ "num_assignments": this.value });
});

document.querySelector('#numTodoItemsSlider').addEventListener('input', function () {
    document.querySelector('#numTodoItems').textContent = this.value;
    chrome.storage.sync.set({ "num_todo_items": this.value });
});

// checkboxes
['assignment_date_format', 'todo_hr24', 'grade_hover', 'hide_completed', 'hover_preview', 'gpa_calc_prepend', 'todo_overdues', 'card_overdues', 'relative_dues'].forEach(checkbox => {
    document.querySelector("#" + checkbox).addEventListener('change', function () {
        let status = this.checked;
        chrome.storage.sync.set(JSON.parse(`{"${checkbox}": ${status}}`));
    });
});

document.querySelector('#customDomain').addEventListener('input', function () {
    let domains = this.value.split(",");
    domains.forEach((domain, index) => {
        let val = domain.replace(" ", "");
        if (!val.includes("https://") && !val.includes("http://")) val = "https://" + val;
        try {
            let url = new URL(val);
            domains[index] = url.hostname;
            clearAlert();
        } catch (e) {
            domains[index] = val;
            displayAlert("The URL you entered appears to be invalid, so it might not work.");
        }
    });
    chrome.storage.local.set({ custom_domain: domains });
});

document.querySelector("#advanced-settings").addEventListener("click", function () {
    displayAdvancedCards();
    document.querySelector(".main").style.display = "none";
    document.querySelector(".advanced").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelector("#gpa-bounds-btn").addEventListener("click", function () {
    displayGPABounds();
    document.querySelector(".main").style.display = "none";
    document.querySelector(".gpa-bounds-container").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelector("#custom-font-btn").addEventListener("click", function () {
    displayCustomFont();
    document.querySelector(".main").style.display = "none";
    document.querySelector(".custom-font-container").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelector("#card-colors-btn").addEventListener("click", function () {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".card-colors-container").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelector("#customize-dark-btn").addEventListener("click", function () {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".customize-dark").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelector("#report-issue-btn").addEventListener("click", function () {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".report-issue-container").style.display = "block";
    chrome.storage.local.get("errors", storage => {
        storage["errors"].forEach(e => {
            document.querySelector("#error_log_output").value += (e + "\n\n");
        })
    });
    window.scrollTo(0, 0);
});

document.querySelector("#import-export-btn").addEventListener("click", function () {
    document.querySelector(".main").style.display = "none";
    document.querySelector(".import-export").style.display = "block";
    window.scrollTo(0, 0);
});

document.querySelectorAll(".back-btn").forEach(btn => {
    btn.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(tab => {
            tab.style.display = "none";
        });
        document.querySelector(".main").style.display = "block";
    });
});

document.querySelectorAll('[data-i18n]').forEach(text => {
    text.innerText = chrome.i18n.getMessage(text.dataset.i18n);
});

document.querySelector("#rk_btn").addEventListener("click", () => {
    chrome.storage.local.get(null, local => {
        chrome.storage.sync.get(null, sync => {
            document.querySelector("#rk_output").value = JSON.stringify(local) + JSON.stringify(sync);
        })
    })
})

document.querySelector("#import-input").addEventListener("input", (e) => {
    const obj = JSON.parse(e.target.value);
    importTheme(obj);
});

document.querySelectorAll(".export-details input").forEach(input => {
    input.addEventListener("change", () => {
        chrome.storage.sync.get(syncedSwitches.concat(syncedSubOptions).concat(["custom_cards", "custom_font", "gpa_calc_bounds"]), sync => {
            chrome.storage.local.get(["dark_preset"], async local => {
                let storage = { ...sync, ...local };
                let final = {};
                for await (item of document.querySelectorAll(".export-details input")) {
                    if (item.checked) {
                        switch (item.id) {
                            case "export-toggles":
                                final = { ...final, ...(await getExport(storage, syncedSwitches.concat(syncedSubOptions))) };
                                break;
                            case "export-dark":
                                final = { ...final, ...(await getExport(storage, ["dark_preset"])) };
                                break;
                            case "export-cards":
                                final = { ...final, ...(await getExport(storage, ["custom_cards"])) };
                                break;
                            case "export-font":
                                final = { ...final, ...(await getExport(storage, ["custom_font"])) };
                                break;
                            case "export-colors":
                                final = { ...final, ...(await getExport(storage, ["card_colors"])) }
                                break;
                            case "export-gpa":
                                final = { ...final, ...(await getExport(storage, ["gpa_calc_bounds"])) }
                                break;
                        }
                    }
                }
                document.querySelector("#export-output").value = JSON.stringify(final);
            });
        });
    });
});

async function getExport(storage, options) {
    let final = {};
    for (const option of options) {
        switch (option) {
            case "custom_cards":
                let arr = [];
                Object.keys(storage["custom_cards"]).forEach(key => {
                    if (storage["custom_cards"][key].img !== "") arr.push(storage["custom_cards"][key].img);
                });
                if (arr.length === 0) {
                    arr = ["none"];
                }
                final["custom_cards"] = arr;
                break;
            case "card_colors":
                final["card_colors"] = [];
                try {
                    final["card_colors"] = await sendFromPopup("getcolors");
                    console.log(final["card_colors"]);
                } catch (e) {
                    console.log(e);
                }
                break;
            default:
                final[option] = storage[option];
        }
    }
    return final;
}

document.querySelectorAll(".theme-button").forEach(btn => {
    let theme = getTheme(btn.id);
    btn.style.backgroundImage = "linear-gradient(#0000008c, #0000008c), url(" + theme.preview + ")";
    btn.addEventListener("click", () => {
        const allOptions = syncedSwitches.concat(syncedSubOptions).concat(["custom_cards", "custom_font", "gpa_calc_bounds", "card_colors"]);
        chrome.storage.sync.get(allOptions, sync => {
            chrome.storage.local.get(["dark_preset", "previous_theme"], async local => {
                const now = Date.now();
                if (local["previous_theme"] === null || now >= local["previous_theme"].expire) {
                    let previous = { ...(await getExport(sync, allOptions)), ...(await getExport(local, ["dark_preset"])) };
                    chrome.storage.local.set({ "previous_theme": { "theme": previous, "expire": now + 28800000 } });
                }
            });
        });

        importTheme(theme.exports);
    });
});

document.querySelector("#theme-revert").addEventListener("click", () => {
    chrome.storage.local.get("previous_theme", local => {
        if (local["previous_theme"] !== null) {
            importTheme(local["previous_theme"]["theme"]);
        }
    });
});

function getTheme(name) {
    const themes = {
        "theme-capybara": { "exports": { "disable_color_overlay": false, "gradient_cards": false, "card_colors": ["#755215"], "custom_font": { "family": "'Rubik'", "link": "Rubik:wght@400;700" }, "dark_preset": { "background-0": "#170d03", "background-1": "#251c04", "background-2": "#0c0c0c", "borders": "#1e1e1e", "links": "#dfa581", "sidebar": "linear-gradient(#9b5a32, #1e1506)", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/originals/ca/93/0c/ca930c4f2edd5012863a38182759bfb5.gif", "https://i.ytimg.com/vi/FWcoYPoD6us/maxresdefault.jpg", "https://i.redd.it/kc2xbmo8kiy71.jpg", "https://i.gifer.com/7Luh.gif", "https://media.tenor.com/fdT-j77p2D4AAAAd/capybara-eating.gif", "https://media.tenor.com/1kZ2j73pGDUAAAAC/capybara-ok-he-pull-up.gif"] }, "preview": "https://i.redd.it/kc2xbmo8kiy71.jpg" },
        "theme-minecraft": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset": { "background-0": "#29180a", "background-1": "#23651a", "background-2": "#20691b", "borders": "#584628", "links": "#88df81", "sidebar": "#478906", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/564x/68/86/fc/6886fcfaeb5a4f8f6812e5828be48a8b.jpg", "https://i.pinimg.com/236x/3b/d7/24/3bd7241c49a73faa34ab9fd143c6aeab.jpg", "https://i.pinimg.com/236x/13/65/be/1365be0d1dfb50fd029b7263ebbac4cb.jpg", "https://i.pinimg.com/236x/00/ea/44/00ea44a404526888ca7f97177dc425bb.jpg", "https://i.pinimg.com/236x/4c/af/e4/4cafe411bec7d26e709fa60a5f8b60d3.jpg", "https://i.pinimg.com/564x/55/77/f0/5577f03d6369372c6a411812eedf61f8.jpg"], "card_colors": ["#88df81"], "custom_font": { "family": "'Silkscreen'", "link": "Silkscreen:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/00/ea/44/00ea44a404526888ca7f97177dc425bb.jpg" },
        "theme-ocean": { "exports": { "disable_color_overlay": false, "gradient_cards": true, "dark_preset": { "background-0": "#212838", "background-1": "#1a2026", "background-2": "#212930", "borders": "#2e3943", "sidebar": "#1a2026", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" }, "custom_cards": ["https://gifdb.com/images/high/shark-school-swarming-ocean-8zqd4b90h7j8r8is.gif", "https://media1.giphy.com/media/Y4K9JjSigTV1FkgiNE/200w.webp?cid=ecf05e47qvqduufaxfzre6akpzg4ikbdx9f8f779krrkb89n&ep=v1_gifs_search&rid=200w.webp&ct=g", "https://media4.giphy.com/media/htdnXEhlPDVDZI3CMu/200w.webp?cid=ecf05e47qvqduufaxfzre6akpzg4ikbdx9f8f779krrkb89n&ep=v1_gifs_search&rid=200w.webp&ct=g", "https://i.gifer.com/6jDi.gif", "https://i.redd.it/2p9in2g3va2b1.gif"], "card_colors": ["#32f6cc", "#31eece", "#30e7cf", "#2fdfd1", "#2ed8d2"], "custom_font": { "link": "Comfortaa:wght@400;700", "family": "'Comfortaa'" }, }, "preview": "https://media4.giphy.com/media/htdnXEhlPDVDZI3CMu/200w.webp?cid=ecf05e47qvqduufaxfzre6akpzg4ikbdx9f8f779krrkb89n&ep=v1_gifs_search&rid=200w.webp&ct=g" },
        "theme-pokemon": { "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_preset": { "background-0": "#110c12", "background-1": "#704776", "background-2": "#5b3960", "borders": "#836487", "links": "#f5a8ff", "sidebar": "linear-gradient(#000000c7, #000000c7), url(\"https://64.media.tumblr.com/c6e4deca70a7e430d8ebe7a6266c4cc1/tumblr_n6gqw4EGiW1tvub8wo1_500.png\")", "sidebar-text": "#ffffff", "text-0": "#ffffff", "text-1": "#c7c7c7", "text-2": "#adadad" }, "custom_cards": ["https://i.pinimg.com/564x/94/29/67/942967bd1f4651e00f019aeddaf10851.jpg", "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZGt2iwyDxBuKJmIalhxlkUM_a_PRUpqEqAcbqO_ZXToer3x9Z", "https://i.pinimg.com/originals/96/c1/65/96c1651cc85f05e22390eac2a7e76978.png", "https://i.pinimg.com/originals/62/a6/1c/62a61c78a2228e23c14fb5b27951c5df.jpg", "https://i.pinimg.com/564x/2f/75/11/2f751137735438b81e3abd3bd954b901.jpg"], "card_colors": ["#e0aaff", "#c77dff", "#9d4edd", "#7b2cbf", "#5a189a"], "custom_font": { "family": "'Rubik'", "link": "Rubik:wght@400;700" } }, "preview": "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRZGt2iwyDxBuKJmIalhxlkUM_a_PRUpqEqAcbqO_ZXToer3x9Z" },
        "theme-kirby": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset": { "background-0": "#fbc1cf", "background-1": "#ae2d45", "background-2": "#5b3960", "borders": "#ae2d45", "links": "#ae2d45", "sidebar": "#ae2d45", "sidebar-text": "#ffffff", "text-0": "#292929", "text-1": "#000000", "text-2": "#000000" }, "custom_cards": ["https://i.pinimg.com/236x/30/19/ab/3019ab7b9f6d2b230a6178231ba3817a.jpg", "https://i.pinimg.com/236x/f0/52/d9/f052d9d8867b66ca7942cf4a2a6c968b.jpg", "https://i.pinimg.com/564x/2e/f0/70/2ef0705eb021d59065239dd553661d4f.jpg", "https://i.pinimg.com/236x/36/a4/73/36a47369afbdb6e91544af173fb0e92d.jpg", "https://i.pinimg.com/236x/6a/9c/60/6a9c604d4070e6d03e15717472851356.jpg"], "card_colors": ["#ae2d45"], "custom_font": { "family": "'Rubik'", "link": "Rubik:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/30/19/ab/3019ab7b9f6d2b230a6178231ba3817a.jpg" },
        "theme-mcdonalds": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset": { "background-0": "#CB2115", "background-1": "#FFC72C", "background-2": "#FFC72C", "borders": "#FFC72C", "links": "#FFC72C", "sidebar": "#FFC72C", "sidebar-text": "#514010", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#ffffff" }, "custom_cards": ["https://i.pinimg.com/236x/03/c3/b7/03c3b7ce47480a7dc6f2fbbb4eee730f.jpg", "https://i.pinimg.com/236x/3e/39/ef/3e39ef786197b2694b34c51ab511dddb.jpg", "https://i.pinimg.com/236x/f8/31/bd/f831bd305b19e9d67471afb4f778e697.jpg", "https://i.pinimg.com/236x/a6/5d/ee/a65dee0c9aeea08bc850f9be5eb8d4dc.jpg", "https://i.pinimg.com/236x/27/a9/5c/27a95c0aefc2d5f260088fd409bb6dd0.jpg", "https://i.pinimg.com/236x/90/9c/eb/909ceb03715e98844f0d617b34740157.jpg"], "card_colors": ["#ffc72c"], "custom_font": { "family": "'Poppins'", "link": "Poppins:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/03/c3/b7/03c3b7ce47480a7dc6f2fbbb4eee730f.jpg" },
        "theme-wavy": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset": { "background-0": "#080808", "background-1": "#0a0a0a", "background-2": "#0a0a0a", "borders": "#2e2b3b", "links": "#b1a2fb", "sidebar": "linear-gradient(#101010c7, #101010c7), url(\"https://i.pinimg.com/236x/80/f6/1f/80f61fadd498cd8201b678a8cdee2746.jpg\")", "sidebar-text": "#f5f5f5", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab" }, "custom_cards": ["https://i.pinimg.com/236x/b2/ff/99/b2ff994c598a5916ca250fd6429a3c01.jpg", "https://i.pinimg.com/236x/34/41/9d/34419d09e540d062a6b43df26c626c20.jpg", "https://i.pinimg.com/236x/c0/d4/cc/c0d4cc0d7041fec03fa21f856a33431c.jpg", "https://i.pinimg.com/236x/bf/46/67/bf4667a532b874050eb477bd891f0551.jpg", "https://i.pinimg.com/236x/ce/0b/8b/ce0b8baaea85445b86d87a610231cf82.jpg", "https://i.pinimg.com/236x/65/c4/ca/65c4ca10b0270634404f2614f30ad684.jpg",], "card_colors": ["#267282", "#d53825", "#1bb0b7", "#c94b43", "#8ebaa6", "#4c8cc4"], "custom_font": { "family": "'Chakra Petch'", "link": "Chakra+Petch:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/34/41/9d/34419d09e540d062a6b43df26c626c20.jpg" },
        "theme-dark": { "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_preset": { "background-0": "#131515", "background-1": "#1f2323", "background-2": "#1f2323", "borders": "#2a3232", "links": "#6c95a7", "sidebar": "#1f2323", "sidebar-text": "#dedede", "text-0": "#c7c7c7", "text-1": "#b0b0b0", "text-2": "#9c9c9c" }, "custom_cards": ["https://i.pinimg.com/236x/c2/09/bc/c209bc5e71df606082deae962cee0e78.jpg", "https://i.pinimg.com/236x/21/54/9f/21549f96b7173fe2c9dc6507dcd4c193.jpg", "https://i.pinimg.com/236x/5b/a2/c2/5ba2c203ce3c1968bdb80c3bbe568520.jpg", "https://i.pinimg.com/236x/da/ab/2c/daab2c18fc3910e3419f8dbc8b4d0acb.jpg", "https://i.pinimg.com/236x/6b/5c/90/6b5c90c34191a3a1ee9c7ca64d822389.jpg", "https://i.pinimg.com/236x/28/a8/fb/28a8fbcde35257c8117e31f502f0b64b.jpg"], "card_colors": ["#284057", "#3e589b", "#3f626f", "#2c4c58", "#2d3e3f", "#535c73"], "custom_font": { "family": "'Merriweather'", "link": "Merriweather:wght@400;700" } }, "preview": "https://i.pinimg.com/236x/21/54/9f/21549f96b7173fe2c9dc6507dcd4c193.jpg" },
        "theme-totoro": { "exports": { "disable_color_overlay": false, "gradient_cards": false, "dark_preset": { "background-0": "#102623", "background-1": "#204744", "background-2": "#35573c", "borders": "#35573c", "text-0": "#9dd0d4", "text-1": "#fafcfb", "text-2": "#fafcfb", "links": "#72a06f", "sidebar": "#204744", "sidebar-text": "#9dd0d4" }, "custom_cards": ["https://i.pinimg.com/originals/0e/d9/7b/0ed97b4de4a7ebd19192dca03bac0ced.gif", "https://i.pinimg.com/564x/b1/af/4a/b1af4a2171930f55dbb625a86676751a.jpg", "https://i.pinimg.com/originals/46/a4/b8/46a4b82ea673d390348309cb65e3b357.gif", "https://i.pinimg.com/564x/a5/a6/f5/a5a6f5446e9366d6c40f0bef29fe1f1a.jpg", "https://i.pinimg.com/originals/7d/04/0e/7d040e94931427709008aaeda14db9c8.gif", "https://i.pinimg.com/originals/fd/b7/b1/fdb7b175cd15b48429fa97bbaa817b08.gif", "https://i.pinimg.com/originals/d8/aa/d9/d8aad938f2beea672124ebf1309584c7.gif", "https://i.pinimg.com/originals/07/96/ba/0796badd897daf8b7230da64a97c612c.gif", "https://i.pinimg.com/originals/46/f7/39/46f7399d22f0f45c14bffd2586691fe0.gif"], "card_colors": ["#023047", "#856003", "#4b6979", "#187288", "#b56000"], "custom_font": { "link": "Jost:wght@400;700", "family": "'Jost'" } }, "preview": "https://i.pinimg.com/originals/0e/d9/7b/0ed97b4de4a7ebd19192dca03bac0ced.gif" },
        "theme-eras": { "exports": {"dark_preset":{"background-0":"#151c37","background-1":"#303554","background-2":"#303554","borders":"#494e74","links":"#eeb4df","sidebar":"#303554","sidebar-text":"#ffffff","text-0":"#ffffff","text-1":"#ededed","text-2":"#a5a5a5"},"custom_cards":["https://images.foxtv.com/static.fox5dc.com/www.fox5dc.com/content/uploads/2023/08/932/524/GettyImages-1604744167.jpg?ve=1&tl=1","https://media1.popsugar-assets.com/files/thumbor/ygMeK-Rm0QEm86LW6Fd3CIBSciU=/fit-in/6000x4000/top/filters:format_auto():extract_cover():upscale()/2023/04/11/843/n/1922283/63fa5bca89225ec5_GettyImages-1474304446.jpg","https://imageio.forbes.com/specials-images/imageserve/64823ba3758d2d944c2a569a/Taylor-Swift--The-Eras-Tour-/960x0.jpg?format=jpg&width=960","https://media.cnn.com/api/v1/images/stellar/prod/230318120226-03-taylor-swift-eras-tour-0317.jpg?c=original","https://pbs.twimg.com/media/F0fOjZzacAYEr08.jpg:large","https://image.cnbcfm.com/api/v1/image/107278487-1690547920875-gettyimages-1564524396-haywardphoto261856_trsqwu49_jyefddip.jpeg?v=1696873880","https://graziamagazine.com/es/wp-content/uploads/sites/12/2023/09/Foggatt-Taylor-Swift-Eras-copia.jpg","https://i.abcnewsfe.com/a/93b560e6-45df-4a00-9d6a-f0f3a0165f72/taylor-swift-brazil-gty-jt-231118_1700327206575_hpMain.jpg","https://images.foxtv.com/static.fox5dc.com/www.fox5dc.com/content/uploads/2023/08/932/524/GettyImages-1604744167.jpg?ve=1&tl=1","https://media1.popsugar-assets.com/files/thumbor/ygMeK-Rm0QEm86LW6Fd3CIBSciU=/fit-in/6000x4000/top/filters:format_auto():extract_cover():upscale()/2023/04/11/843/n/1922283/63fa5bca89225ec5_GettyImages-1474304446.jpg","https://imageio.forbes.com/specials-images/imageserve/64823ba3758d2d944c2a569a/Taylor-Swift--The-Eras-Tour-/960x0.jpg?format=jpg&width=960","https://media.cnn.com/api/v1/images/stellar/prod/230318120226-03-taylor-swift-eras-tour-0317.jpg?c=original","https://pbs.twimg.com/media/F0fOjZzacAYEr08.jpg:large"],"card_colors":["#eeb4df"],"custom_font":{"family":"'DM Sans'","link":"DM+Sans:wght@400;700"}}, "preview": "https://imageio.forbes.com/specials-images/imageserve/64823ba3758d2d944c2a569a/Taylor-Swift--The-Eras-Tour-/960x0.jpg?format=jpg&width=960"},
        "theme-ghibli": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset":{"background-0":"#e6e6e6","background-1":"#f5f5f5","background-2":"#d4d4d4","borders":"#c7cdd1","links":"#738678","sidebar":"#738678","sidebar-text":"#ffffff","text-0":"#4d5d53","text-1":"#777e72","text-2":"#a5a5a5"},"custom_cards":["https://media1.tenor.com/m/d_Yb1KEUhgEAAAAC/lvrnjm-warawara.gif","https://media.tenor.com/JYgEKjfi3uIAAAAM/anim-howls-moving-castle.gif","https://media.tenor.com/oABoYJfl05kAAAAM/majonotakkyubin-kikisdelivery.gif","https://media1.tenor.com/m/QeNq3_I5-owAAAAC/green-studio-ghibli.gif","https://media1.tenor.com/m/YjCqkJ7kQRkAAAAC/my-neighbor-totoro.gif","https://media.tenor.com/ax94CJ1L_IoAAAAM/cute.gif","https://media.tenor.com/faPlGUjSrggAAAAM/totoro-chibi-totoro.gif"],"card_colors":["#6b705c","#a5a58d","#b7b7a4","#4d5d53","#b7c9af","#738678","#6b705c"],"custom_font":{"family":"'Playfair Display'","link":"Playfair+Display:wght@400;700"}}, "preview": "https://media.tenor.com/ax94CJ1L_IoAAAAM/cute.gif"},
        "theme-purple": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset":{"background-0":"#0f0f0f","background-1":"#0c0c0c","background-2":"#141414","borders":"#1e1e1e","links":"#f5f5f5","sidebar":"#0c0c0c","sidebar-text":"#f5f5f5","text-0":"#f5f5f5","text-1":"#e2e2e2","text-2":"#ababab"},"custom_cards":["https://i.imgur.com/HSR9yIV.jpg","https://i.imgur.com/y2q6zwV.jpg","https://i.imgur.com/H2v1YWD.jpg","https://i.imgur.com/D2mHuH2.jpg","https://i.imgur.com/HgcgCrr.jpg","https://i.imgur.com/wvkvzTb.jpg","https://i.imgur.com/Q6KKKe1.jpg"],"card_colors":["#6f34f9"],"custom_font":{"family":"'Roboto Mono'","link":"Roboto+Mono:wght@400;700"}}, "preview": "https://i.imgur.com/D2mHuH2.jpg"},
        "theme-flowers": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset":{"background-0":"#fff0f0","background-1":"#ffafbd","background-2":"#ffafbd","borders":"#ffafbd","links":"#e56182","sidebar":"#ffafbd","sidebar-text":"#fbeef2","text-0":"#e56182","text-1":"#e56183","text-2":"#ffafbd"},"custom_cards":["https://i.pinimg.com/564x/e6/9f/1d/e69f1dd00ade9de2ee056237b32cfd31.jpg","https://i.pinimg.com/564x/b4/64/6e/b4646e96b2fad3a816bbc001e96974b1.jpg","https://i.pinimg.com/564x/a3/60/36/a36036af9412b7271c371e8d5fa7b4ba.jpg","https://i.pinimg.com/736x/7c/7a/c8/7c7ac8b643b750da71bb998bef593b58.jpg","https://i.pinimg.com/564x/ce/c9/d1/cec9d1b3757b98894ab90182f15b7b33.jpg","https://i.pinimg.com/736x/65/70/de/6570deac9ff58a9bde044cc62803a0e8.jpg","https://i.pinimg.com/564x/5f/9f/9a/5f9f9aebee92c88d916137cafc717d4e.jpg"],"card_colors":["#e56182",],"custom_font":{"family":"'Caveat'","link":"Caveat:wght@400;700"}}, "preview": "https://i.pinimg.com/564x/b4/64/6e/b4646e96b2fad3a816bbc001e96974b1.jpg"},
        "theme-lilac": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset":{"background-0":"#adb7db","background-1":"#838caf","background-2":"#838caf","borders":"#080821","links":"#121131","sidebar":"#838caf","sidebar-text":"#080821","text-0":"#080821","text-1":"#080821","text-2":"#242461"},"custom_cards":["https://i.pinimg.com/474x/17/92/c1/1792c16af2c210cce4280d03e8a97396.jpg","https://i.pinimg.com/474x/1c/af/9b/1caf9bd8c7b683ecd684a866e8227baf.jpg","https://i.etsystatic.com/21095131/r/il/0e4ddd/3584401402/il_fullxfull.3584401402_f867.jpg","https://64.media.tumblr.com/d180947a80af3fd0e25453c89cb8d222/tumblr_pqdi8vwbkQ1si78dx_1280.jpg","https://wallpapers.com/images/hd/periwinkle-aesthetic-dandelion-field-qtcn9i6giu0yn3a3.jpg","https://i.pinimg.com/474x/8a/76/5a/8a765ae11cfb0749f9c0e0a9fab35582.jpg","https://i.pinimg.com/474x/fb/c1/98/fbc198da9827fc89a189a55cf0c0ce64.jpg"],"card_colors":["#080821"],"custom_font":{"family":"'Comfortaa'","link":"Comfortaa:wght@400;700"}}, "preview": "https://wallpapers.com/images/hd/periwinkle-aesthetic-dandelion-field-qtcn9i6giu0yn3a3.jpg"},
        "theme-pinkjapan": { "exports": { "disable_color_overlay": false, "gradient_cards": true, "dark_preset":{"background-0":"#fff0f5","background-1":"#ffc7dd","background-2":"#ffc7dd","borders":"#ffc7dd","links":"#ff80bd","sidebar":"linear-gradient(#ffc7ddc7, #ffc7ddc7), url(\"https://i.pinimg.com/474x/f9/1f/ce/f91fced51498b3456b80312fdd953ce1.jpg\")","sidebar-text":"#ffffff","text-0":"#ff80bd","text-1":"#ff80bd","text-2":"#ff80bd"},"custom_cards":["https://i.pinimg.com/474x/92/d8/d4/92d8d4e9d0b61e5f9574c00976725a28.jpg","https://i.pinimg.com/474x/c6/52/f0/c652f0253c8ec6c794add92329e21369.jpg","https://i.pinimg.com/474x/d2/df/02/d2df02bd7a5946045814fd5700b323f1.jpg","https://i.pinimg.com/474x/95/46/63/954663a3d108406009a26dab1142e520.jpg","https://i.pinimg.com/474x/69/51/db/6951db7b8ba65c468b1d5cc1b8055546.jpg","https://i.pinimg.com/474x/dd/51/b4/dd51b466f93d2bb733d42efb97476224.jpg","https://i.pinimg.com/474x/8a/cc/11/8acc111b37b4d1cdfee89ab7e48ee548.jpg","https://i.pinimg.com/474x/60/fb/47/60fb47640a25fca8d9f0db8ee7a538b4.jpg","https://i.pinimg.com/474x/30/5d/a8/305da88a22614323a1c449c7692f6204.jpg","https://i.pinimg.com/474x/44/8b/d0/448bd0957ec3b2da842312461e069fcc.jpg"],"card_colors":["#ff80bd"],"custom_font":{"family":"'DM Sans'","link":"DM+Sans:wght@400;700"}}, "preview": "https://i.pinimg.com/474x/95/46/63/954663a3d108406009a26dab1142e520.jpg"},
        "theme-kuromi": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset":{"background-0":"#391d3e","background-1":"#a077a6","background-2":"#a58fa8","borders":"#836487","links":"#e1bce6","sidebar":"linear-gradient(#352537c7, #352537c7), url(\"https://static.vecteezy.com/system/resources/thumbnails/018/939/219/small/pastel-purple-hearts-seamless-geometric-pattern-with-diagonal-circle-line-background-free-vector.jpg\")","sidebar-text":"#ffffff","text-0":"#ffffff","text-1":"#ffffff","text-2":"#ffffff"},"custom_cards":["https://i.pinimg.com/originals/90/df/66/90df6664fb0bf88a11fec12e34caf53d.gif","https://i.pinimg.com/originals/bc/59/15/bc5915d9e2b7e43e6531cc6a81cbef4d.gif"],"card_colors":["#e0aaff","#177b63"],"custom_font":{"family":"'Silkscreen'","link":"Silkscreen:wght@400;700"}}, "preview": "https://i.pinimg.com/originals/90/df/66/90df6664fb0bf88a11fec12e34caf53d.gif"},
        "theme-sillycats": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset":{"background-0":"#0d0d21","background-1":"#0d0d21","background-2":"#341849","borders":"#0c466c","links":"#56Caf0","sidebar":"#0c466c","sidebar-text":"#3f7eaa","text-0":"#f5f5f5","text-1":"#e2e2e2","text-2":"#ababab"},"custom_cards":["https://i.pinimg.com/564x/46/88/1d/46881dbea1181428c18eb49f60212bd5.jpg","https://i.pinimg.com/474x/0e/9f/5a/0e9f5a491305242147907ad86539f010.jpg","https://i.pinimg.com/236x/74/51/d5/7451d50902dddb215e193734ac49981b.jpg","https://i.pinimg.com/236x/cf/88/6a/cf886ad3d12477b4dee8f98072806dbd.jpg","https://i.pinimg.com/736x/6d/e0/4e/6de04e262c56dc9a9b733eec9a16e5b3.jpg","https://i.pinimg.com/236x/b3/d9/1e/b3d91e35684a51f3afa5abefae1a7ce5.jpg"],"card_colors":["#3f7eaa"],"custom_font":{"family":"'Comfortaa'","link":"Comfortaa:wght@400;700"}}, "preview": "https://i.pinimg.com/236x/b3/d9/1e/b3d91e35684a51f3afa5abefae1a7ce5.jpg"},
        "theme-onepiece": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset":{"background-0":"#fef6d7","background-1":"#942222","background-2":"#1a1a1a","borders":"#272727","links":"#942222","sidebar":"#feefb4","sidebar-text":"#000000","text-0":"#000000","text-1":"#000000","text-2":"#000000"},"custom_cards":["https://preview.redd.it/goofy-frames-v0-gcoti56dlltb1.jpg?width=567&format=pjpg&auto=webp&s=3b44cbcc94cdcc360e07115dc17d1f9a23c7c2e1","https://i.pinimg.com/236x/df/c0/74/dfc074b259975bc010100eb36439fe18.jpg","https://preview.redd.it/if-zoro-got-lost-and-ended-up-in-the-back-rooms-do-you-v0-404t0gtyebcb1.png?auto=webp&s=f188b2b5be9e79886d78bab59e03f9eb3cb0a331","https://4.bp.blogspot.com/-11EYfCo7EB4/TwNYx_cDKmI/AAAAAAAAJy4/5eZn-GElZkY/s1600/luffy%2Bpeace%2Bsign.jpeg"], "card_colors": ["#942222"], "custom_font":{"family":"'Caveat'","link":"Caveat:wght@400;700"}}, "preview": "https://i.pinimg.com/236x/df/c0/74/dfc074b259975bc010100eb36439fe18.jpg"},
        "theme-shark": { "exports": { "disable_color_overlay": true, "gradient_cards": false, "dark_preset":{"background-0":"#0a272e","background-1":"#103842","background-2":"#103842","borders":"#1a5766","links":"#3bb9d8","sidebar":"#103842","sidebar-text":"#f5f5f5","text-0":"#f5f5f5","text-1":"#e2e2e2","text-2":"#ababab"},"custom_cards":["https://i.pinimg.com/originals/0b/9e/a3/0b9ea33d064d84a40ef294728c41f85b.jpg","https://i.pinimg.com/736x/6b/ee/df/6beedf5c1258a1ab3c2b244bcb8cf9d1.jpg","https://i.pinimg.com/474x/ef/06/eb/ef06eb139d8e8d1300e2a6f4a2e352af.jpg","https://p16-va.lemon8cdn.com/tos-maliva-v-ac5634-us/oUoyiAz4EgBhAAG1N6BoIRAfDOR60jIyX062E2~tplv-tej9nj120t-origin.webp","https://p16-va.lemon8cdn.com/tos-maliva-v-ac5634-us/oANyp42A6TziDRJhR2fy6EAXghAoIoBGOIAE6B~tplv-tej9nj120t-origin.webp"],"card_colors":["#1770ab","#74c69d","#74c69d","#74c69d","#52b788"],"custom_font":{"family":"'Silkscreen'","link":"Silkscreen:wght@400;700"}}, "preview": "https://p16-va.lemon8cdn.com/tos-maliva-v-ac5634-us/oANyp42A6TziDRJhR2fy6EAXghAoIoBGOIAE6B~tplv-tej9nj120t-origin.webp"}, 

        "theme-catppuccin": { "exports": { "dark_preset": { "background-0": "#11111b", "background-1": "#181825", "background-2": "#1e1e2e", "borders": "#4f5463", "text-0": "#cdd6f4", "text-1": "#7f849c", "text-2": "#a6e3a1", "links": "#f5c2e7", "sidebar": "#181825", "sidebar-text": "#7f849c" } }, "preview": "" },
        "theme-sage": { "exports": { "dark_preset": { "background-0": "#2f3e46", "background-1": "#354f52", "background-2": "#52796f", "borders": "#84a98c", "links": "#d8f5c7", "sidebar": "#354f52", "sidebar-text": "#e2e8de", "text-0": "#e2e8de", "text-1": "#cad2c5", "text-2": "#adb1aa" }}, "preview": "" },
    }
    return themes[name] || {};
}

function importTheme(theme) {
    try {
        let keys = Object.keys(theme);
        let final = {};
        chrome.storage.sync.get("custom_cards", sync => {
            keys.forEach(key => {
                switch (key) {
                    case "dark_preset":
                        changeToPresetCSS(null, theme["dark_preset"]);
                        break;
                    case "card_colors":
                        sendFromPopup("setcolors", theme["card_colors"]);
                        break;
                    case "custom_cards":
                        if (theme["custom_cards"].length > 0) {
                            let pos = 0;
                            Object.keys(sync["custom_cards"]).forEach(key => {
                                console.log("setting image to ", theme["custom_cards"][pos]);
                                sync["custom_cards"][key].img = theme["custom_cards"][pos];
                                pos = (pos === theme["custom_cards"].length - 1) ? 0 : pos + 1;
                            });
                        }
                        final["custom_cards"] = sync["custom_cards"];
                        break;
                    default:
                        final[key] = theme[key];
                        break;
                }
            });
            chrome.storage.sync.set(final);
        });
    } catch (e) {
        console.log(e);
    }
}

function updateCards(key, value) {
    chrome.storage.sync.get(["custom_cards"], result => {
        chrome.storage.sync.set({ "custom_cards": { ...result["custom_cards"], [key]: { ...result["custom_cards"][key], ...value } } }, () => {
            if (chrome.runtime.lastError) {
                displayAlert("The data you're entering is exceeding the storage limit, so it won't save. Try using shorter links, and make sure to press \"copy image address\" and not \"copy image\" for links.");
            }
        })
    });
}

function displayCustomFont() {
    chrome.storage.sync.get(["custom_font"], storage => {
        let el = document.querySelector(".custom-font");
        let linkContainer = document.querySelector(".custom-font-flex") || makeElement("div", "custom-font-flex", el);
        linkContainer.innerHTML = '<span>https://fonts.googleapis.com/css2?family=</span><input class="card-input" id="custom-font-link"></input>';
        let link = linkContainer.querySelector("#custom-font-link");
        link.value = storage.custom_font.link;

        link.addEventListener("change", function (e) {
            let linkVal = e.target.value.split(":")[0];
            let familyVal = linkVal.replace("+", " ");
            linkVal += linkVal === "" ? "" : ":wght@400;700";
            familyVal = linkVal === "" ? "" : "'" + familyVal + "'";
            chrome.storage.sync.set({ "custom_font": { "link": linkVal, "family": familyVal } });
            link.value = linkVal;
        });

        const popularFonts = ["Caveat", "Comfortaa", "Corben", "DM Sans", "Expletus Sans", "Happy Monkey", "Inconsolata", "Jost", "Lobster", "Montserrat", "Nanum Myeongjo", "Open Sans", "Oswald", "Permanent Marker", "Playfair Display", "Poppins", "Quicksand", "Rakkas", "Redacted Script", "Roboto Mono", "Rubik", "Silkscreen", "Tektur"];
        let quickFonts = document.querySelector("#quick-fonts");
        quickFonts.textContent = "";
        let noFont = makeElement("button", "customization-button", quickFonts, "None");
        noFont.addEventListener("click", () => {
            chrome.storage.sync.set({ "custom_font": { "link": "", "family": "" } });
            link.value = "";
        })
        popularFonts.forEach(font => {
            let btn = makeElement("button", "customization-button", quickFonts, font);
            btn.addEventListener("click", () => {
                let linkVal = font.replace(" ", "+") + ":wght@400;700";
                chrome.storage.sync.set({ "custom_font": { "link": linkVal, "family": "'" + font + "'" } });
                link.value = linkVal;
            });
        });
    });
}

function displayGPABounds() {
    chrome.storage.sync.get(["gpa_calc_bounds"], storage => {
        const order = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
        const el = document.querySelector(".gpa-bounds");
        el.textContent = "";
        order.forEach(key => {
            let inputs = makeElement("div", "gpa-bounds-item", el);
            inputs.innerHTML += '<div><span class="gpa-bounds-grade"></span><input class="gpa-bounds-input gpa-bounds-cutoff" type="text"></input><span style="margin-left:6px;margin-right:6px;">%</span><input class="gpa-bounds-input gpa-bounds-gpa" type="text" value=></input><span style="margin-left:6px">GPA</span></div>';
            inputs.querySelector(".gpa-bounds-grade").textContent = key;
            inputs.querySelector(".gpa-bounds-cutoff").value = storage["gpa_calc_bounds"][key].cutoff;
            inputs.querySelector(".gpa-bounds-gpa").value = storage["gpa_calc_bounds"][key].gpa;

            inputs.querySelector(".gpa-bounds-cutoff").addEventListener("change", function (e) {
                chrome.storage.sync.get(["gpa_calc_bounds"], existing => {
                    chrome.storage.sync.set({ "gpa_calc_bounds": { ...existing["gpa_calc_bounds"], [key]: { ...existing["gpa_calc_bounds"][key], "cutoff": parseFloat(e.target.value) } } });
                });
            });

            inputs.querySelector(".gpa-bounds-gpa").addEventListener("change", function (e) {
                chrome.storage.sync.get(["gpa_calc_bounds"], existing => {
                    chrome.storage.sync.set({ "gpa_calc_bounds": { ...existing["gpa_calc_bounds"], [key]: { ...existing["gpa_calc_bounds"][key], "gpa": parseFloat(e.target.value) } } });
                });
            });
        });
    });
}

document.querySelector("#alert").addEventListener("click", clearAlert);

let removeAlert = null;

function clearAlert() {
    clearTimeout(removeAlert);
    document.querySelector("#alert").style.bottom = "-400px";
}

function displayAlert(msg) {
    clearTimeout(removeAlert);
    document.querySelector("#alert").style.bottom = "0";
    document.querySelector("#alert").textContent = msg;
    removeAlert = setTimeout(() => {
        clearAlert();
    }, 15000);
}

function setCustomImage(key, val) {
    if (val !== "" && val !== "none") {
        let test = new Image();
        test.onerror = () => {
            displayAlert("It seems that the image link you provided isn't working. Make sure to right click on any images you want to use and select \"copy image address\" to get the correct link.");

            // ensures storage limit error will override previous error
            updateCards(key, { "img": val });
        }
        test.onload = clearAlert;
        test.src = val;
    }
    updateCards(key, { "img": val });
}

function displayAdvancedCards() {
    sendFromPopup("getCards");
    chrome.storage.sync.get(["custom_cards", "custom_cards_2"], storage => {
        document.querySelector(".advanced-cards").innerHTML = '<div id="advanced-current"></div><div id="advanced-past"><h2>Past Courses</h2></div>';
        const keys = storage["custom_cards"] ? Object.keys(storage["custom_cards"]) : [];
        if (keys.length > 0) {
            let currentEnrollment = keys.reduce((max, key) => storage["custom_cards"][key]?.eid > max ? storage["custom_cards"][key].eid : max, -1);
            keys.forEach(key => {
                let term = document.querySelector("#advanced-past");
                if (storage["custom_cards"][key].eid === currentEnrollment) {
                    term = document.querySelector("#advanced-current");
                }
                let card = storage["custom_cards"][key];
                let card_2 = storage["custom_cards_2"][key] || {};
                if (!card || !card_2 || !card_2["links"] || card_2["links"]["custom"]) {
                    console.log(key + " error...");
                    console.log("card = ", card, "card_2", card_2, "links", card_2["links"]);
                } else {
                    let container = makeElement("div", "custom-card", term);
                    container.classList.add("option-container");
                    container.innerHTML = '<div class="custom-card-header"><p class="custom-card-title"></p><div class="custom-card-hide"><p class="custom-key">Hide</p></div></div><div class="custom-card-inputs"><div class="custom-card-left"><div class="custom-card-image"><span class="custom-key">Image</span></div><div class="custom-card-name"><span class="custom-key">Name</span></div><div class="custom-card-code"><span class="custom-key">Code</span></div></div><div class="custom-links-container"><p class="custom-key">Links</p><div class="custom-links"></div></div></div>';
                    let imgInput = makeElement("input", "card-input", container.querySelector(".custom-card-image"));
                    let nameInput = makeElement("input", "card-input", container.querySelector(".custom-card-name"));
                    let codeInput = makeElement("input", "card-input", container.querySelector(".custom-card-code"));
                    let hideInput = makeElement("input", "card-input-checkbox", container.querySelector(".custom-card-hide"));
                    imgInput.placeholder = "Image url";
                    nameInput.placeholder = "Custom name";
                    codeInput.placeholder = "Custom code";
                    hideInput.type = "checkbox";
                    imgInput.value = card.img;
                    nameInput.value = card.name;
                    codeInput.value = card.code;
                    hideInput.checked = card.hidden;
                    if (card.img && card.img !== "") container.style.background = "linear-gradient(155deg, #1e1e1ef2 20%, #1e1e1ebf), url(\"" + card.img + "\") center / cover no-repeat";
                    imgInput.addEventListener("change", e => {
                        setCustomImage(key, e.target.value);
                        container.style.background = e.target.value === "" ? "#1e1e1e" : "linear-gradient(155deg, #1e1e1ef2 20%, #1e1e1ebf), url(\"" + e.target.value + "\") center / cover no-repeat";
                    });
                    nameInput.addEventListener("change", function (e) { updateCards(key, { "name": e.target.value }) });
                    codeInput.addEventListener("change", function (e) { updateCards(key, { "code": e.target.value }) });
                    hideInput.addEventListener("change", function (e) { updateCards(key, { "hidden": e.target.checked }) });
                    container.querySelector(".custom-card-title").textContent = card.default;

                    for (let i = 0; i < 4; i++) {
                        let customLink = makeElement("input", "card-input", container.querySelector(".custom-links"));
                        customLink.value = card_2.links[i].is_default ? "default" : card_2.links[i].path;
                        customLink.addEventListener("change", function (e) {
                            chrome.storage.sync.get("custom_cards_2", storage => {
                                let newLinks = storage.custom_cards_2[key].links;
                                if (e.target.value === "" || e.target.value === "default") {
                                    console.log("this value is empty....")
                                    //newLinks[i] = { "type": storage.custom_cards_2[key].links.default[i].type, "default": true };
                                    newLinks[i] = { "default": newLinks[i].default, "is_default": true, "path": newLinks[i].default };
                                    customLink.value = "default";
                                } else {
                                    //newLinks[i] = { "type": getLinkType(e.target.value), "path": e.target.value, "default": false };
                                    let val = e.target.value;
                                    if (!e.target.value.includes("https://") && e.target.value !== "none") val = "https://" + val;
                                    newLinks[i] = { "default": newLinks[i].default, "is_default": false, "path": val };
                                    customLink.value = val;
                                }
                                chrome.storage.sync.set({ "custom_cards_2": { ...storage.custom_cards_2, [key]: { ...storage.custom_cards_2[key], "links": newLinks } } })
                            });
                        });
                    }
                };
            });
        } else {
            document.querySelector(".advanced-cards").innerHTML = `<div class="option-container"><h3>Couldn't find your cards!<br/>You may need to refresh your Canvas page and/or this menu page.<br/><br/>If you're having issues please contact me - ksucpea@gmail.com</h3></div>`;
        }
    });
}

/*
chrome.runtime.onMessage.addListener(message => {
    if (message === "getCardsComplete") {
        displayAdvancedCards();
    }
});
*/

syncedSwitches.forEach(function (option) {
    let optionSwitch = document.querySelector('#' + option);
    chrome.storage.sync.get(option, function (result) {
        let status = result[option] === true ? "#on" : "#off";
        optionSwitch.querySelector(status).checked = true;
        optionSwitch.querySelector(status).classList.add('checked');
    });

    optionSwitch.querySelector(".slider").addEventListener('mouseup', function () {
        optionSwitch.querySelector("#on").checked = !optionSwitch.querySelector("#on").checked;
        optionSwitch.querySelector("#on").classList.toggle('checked');
        optionSwitch.querySelector("#off").classList.toggle('checked');
        let status = optionSwitch.querySelector("#on").checked;
        chrome.storage.sync.set({ [option]: status });
        if (option === "auto_dark") {
            toggleDarkModeDisable(status);
        }
    });
});

localSwitches.forEach(option => {
    let optionSwitch = document.querySelector('#' + option);
    chrome.storage.local.get(option, function (result) {
        let status = result[option] === true ? "#on" : "#off";
        optionSwitch.querySelector(status).checked = true;
        optionSwitch.querySelector(status).classList.add('checked');
    });
    optionSwitch.querySelector(".slider").addEventListener('mouseup', function () {
        optionSwitch.querySelector("#on").checked = !optionSwitch.querySelector("#on").checked;
        optionSwitch.querySelector("#on").classList.toggle('checked');
        optionSwitch.querySelector("#off").classList.toggle('checked');
        let status = optionSwitch.querySelector("#on").checked;
        chrome.storage.local.set({ [option]: status });

        /*
        switch (option) {
            case 'dark_mode': chrome.storage.local.set({ dark_mode: status }); sendFromPopup("darkmode"); break;
        }
        */
    });
});

['autodark_start', 'autodark_end'].forEach(function (timeset) {
    document.querySelector('#' + timeset).addEventListener('change', function () {
        let timeinput = { "hour": this.value.split(':')[0], "minute": this.value.split(':')[1] };
        timeset === "autodark_start" ? chrome.storage.sync.set({ auto_dark_start: timeinput }) : chrome.storage.sync.set({ auto_dark_end: timeinput });
    });
});

function toggleDarkModeDisable(disabled) {
    let darkSwitch = document.querySelector('#dark_mode');
    if (disabled === true) {
        darkSwitch.classList.add('switch_disabled');
        darkSwitch.style.pointerEvents = "none";
    } else {
        darkSwitch.classList.remove('switch_disabled');
        darkSwitch.style.pointerEvents = "auto";
    }
}

// customization tab

document.querySelector("#setToDefaults").addEventListener("click", setToDefaults);

document.querySelectorAll(".preset-button.customization-button").forEach(btn => btn.addEventListener("click", changeToPresetCSS));

document.querySelector("#singleColorInput").addEventListener("change", e => document.querySelector("#singleColorText").value = e.target.value);
document.querySelector("#singleColorText").addEventListener("change", e => document.querySelector("#singleColorInput").value = e.target.value);

document.querySelector("#gradientColorFrom").addEventListener("change", e => document.querySelector("#gradientColorFromText").value = e.target.value);
document.querySelector("#gradientColorFromText").addEventListener("change", e => document.querySelector("#gradientColorFrom").value = e.target.value);

document.querySelector("#gradientColorTo").addEventListener("change", e => document.querySelector("#gradientColorToText").value = e.target.value);
document.querySelector("#gradientColorToText").addEventListener("change", e => document.querySelector("#gradientColorTo").value = e.target.value);

document.querySelector("#revert-colors").addEventListener("click", () => {
    chrome.storage.local.get("previous_colors", local => {
        if (local["previous_colors"] !== null) {
            sendFromPopup("setcolors", local["previous_colors"].colors);
        }
    })
})

document.querySelectorAll(".preset-button.colors-button").forEach(btn => {
    const colors = getPalette(btn.querySelector("p").textContent);
    let preview = btn.querySelector(".colors-preview");
    colors.forEach(color => {
        let div = makeElement("div", "color-preview", preview);
        div.style.background = color;
    });
    btn.addEventListener("click", () => {
        sendFromPopup("setcolors", colors);
    })
});

document.querySelector("#setSingleColor").addEventListener("click", () => {
    let colors = [document.querySelector("#singleColorInput").value];;
    sendFromPopup("setcolors", colors);
});

function getPalette(name) {
    const colors = {
        "Blues": ["#ade8f4", "#90e0ef", "#48cae4", "#00b4d8", "#0096c7"],
        "Reds": ["#e01e37", "#c71f37", "#b21e35", "#a11d33", "#6e1423"],
        "Rainbow": ["#ff0000", "#ff5200", "#efea5a", "#3cf525", "#147df5", "#be0aff"],
        "Candy": ["#cdb4db", "#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"],
        "Purples": ["#e0aaff", "#c77dff", "#9d4edd", "#7b2cbf", "#5a189a"],
        "Pastels": ["#fff1e6", "#fde2e4", "#fad2e1", "#bee1e6", "#cddafd"],
        "Ocean": ["#22577a", "#38a3a5", "#57cc99", "#80ed99", "#c7f9cc"],
        "Sunset": ["#eaac8b", "#e56b6f", "#b56576", "#6d597a", "#355070"],
        "Army": ["#6b705c", "#a5a58d", "#b7b7a4", "#ffe8d6", "#ddbea9", "#cb997e"],
        "Pinks": ["#ff0a54", "#ff5c8a", "#ff85a1", "#ff99ac", "#fbb1bd"],
        "Watermelon": ["#386641", "#6a994e", "#a7c957", "#f2e8cf", "#bc4749"],
        "Popsicle": ["#70d6ff", "#ff70a6", "#ff9770", "#ffd670", "#e9ff70"],
        "Chess": ["#ffffff", "#000000"],
        "Greens": ["#d8f3dc", "#b7e4c7", "#95d5b2", "#74c69d", "#52b788"],
        "Fade": ["#ff69eb", "#ff86c8", "#ffa3a5", "#ffbf81", "#ffdc5e"],
        "Oranges": ["#ffc971", "#ffb627", "#ff9505", "#e2711d", "#cc5803"],
        "Mesa": ["#f6bd60", "#f28482", "#f5cac3", "#84a59d", "#f7ede2"],
        "Berries": ["#4cc9f0", "#4361ee", "#713aed", "#9348c3", "#f72585"],
        "Fade2": ["#f2f230", "#C2F261", "#91f291", "#61F2C2", "#30f2f2"],
        "Muted": ["#E7E6F7", "#E3D0D8", "#AEA3B0", "#827081", "#C6D2ED"],
        "Base": ["#e3b505", "#95190C", "#610345", "#107E7D", "#044B7F"],
        "Fruit": ["#7DDF64", "#C0DF85", "#DEB986", "#DB6C79", "#ED4D6E"],
        "Night": ["#25171A", "#4B244A", "#533A7B", "#6969B3", "#7F86C6"]
    }
    return colors[name] || [];
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function getColorInGradient(d, from, to) {
    let pat = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    var exec1 = pat.exec(from);
    var exec2 = pat.exec(to);
    let a1 = [parseInt(exec1[1], 16), parseInt(exec1[2], 16), parseInt(exec1[3], 16)];
    let a2 = [parseInt(exec2[1], 16), parseInt(exec2[2], 16), parseInt(exec2[3], 16)];
    let rgb = a1.map((x, i) => Math.floor(a1[i] + d * (a2[i] - a1[i])));
    return "#" + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
}

document.querySelector("#setGradientColor").addEventListener("click", () => {
    chrome.storage.sync.get("custom_cards", sync => {
        length = 0;
        Object.keys(sync["custom_cards"]).forEach(key => {
            if (sync["custom_cards"][key].hidden !== true) length++;
        });
        let colors = [];
        let from = document.querySelector("#gradientColorFrom").value;
        let to = document.querySelector("#gradientColorTo").value;
        for (let i = 1; i <= length; i++) {
            colors.push(getColorInGradient(i / length, from, to));
        }
        sendFromPopup("setcolors", colors);
    });
});

/*
function getColors(preset) {
    console.log(preset)
    Object.keys(preset).forEach(key => {
        try {
            let c = document.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            [color, text].forEach(changer => {
                changer.value = preset[key];
                changer.addEventListener("change", function (e) {
                    changeCSS(key, e.target.value);
                });
            });
        } catch (e) {
            console.log("couldn't get " + key)
            console.log(e);
        }
    });
}
*/

/*
function getColors2(data) {
    const colors = data.split(":root")[1].split("--bcstop")[0];
    const backgroundcolors = document.querySelector("#option-background");
    const textcolors = document.querySelector("#option-text");
    colors.split(";").forEach(function (color) {
        const type = color.split(":")[0].replace("{", "").replace("}", "");
        const currentColor = color.split(":")[1];
        if (type) {
            let container = makeElement("div", "changer-container", type.includes("background") ? backgroundcolors : textcolors);
            let colorChange = makeElement("input", "card-input", container);
            let colorChangeText = makeElement("input", "card-input", container);
            colorChangeText.type = "text";
            colorChangeText.value = currentColor;
            colorChange.type = "color";
            colorChange.value = currentColor;
            [colorChange, colorChangeText].forEach(changer => {
                changer.addEventListener("change", function (e) {
                    changeCSS(type, e.target.value);
                });
            });
        }
    })
}
*/

function showd() {

}

function displaySidebarMode(mode, style) {
    console.log("changing to", mode, "with existing", style);
    style = style.replace(" ", "");
    let match = style.match(/linear-gradient\((?<color1>\#\w*),(?<color2>\#\w*)\)/);
    let c1 = c2 = "#000000";
    console.log(match);

    if (mode === "image") {
        document.querySelector("#radio-sidebar-image").checked = true;
        document.querySelector("#sidebar-color2").style.display = "flex";
        document.querySelector("#sidebar-image").style.display = "flex";
        if (style.includes("url") && match) {
            if (match.groups.color1) c1 = match.groups.color1.replace("c7", "");
            if (match.groups.color2) c2 = match.groups.color2.replace("c7", "");
        }
        let url = style.match(/url\(\"(?<url>.*)\"\)/);
        document.querySelector('#sidebar-image input[type="text"]').value = url && url.groups.url ? url.groups.url : "";
    } else if (mode === "gradient") {
        document.querySelector("#radio-sidebar-gradient").checked = true;
        document.querySelector("#sidebar-color2").style.display = "flex";
        document.querySelector("#sidebar-image").style.display = "none";
        if (!style.includes("url") && match) {
            if (match.groups.color1) c1 = match.groups.color1;
            if (match.groups.color2) c2 = match.groups.color2;
        }
    } else {
        document.querySelector("#radio-sidebar-solid").checked = true;
        document.querySelector("#sidebar-color2").style.display = "none";
        document.querySelector("#sidebar-image").style.display = "none";
        c1 = match ? "#000000" : style;
    }

    document.querySelector('#sidebar-color1 input[type="text"]').value = c1;
    document.querySelector('#sidebar-color1 input[type="color"]').value = c1;
    document.querySelector('#sidebar-color2 input[type="text"]').value = c2;
    document.querySelector('#sidebar-color2 input[type="color"]').value = c2;
}

chrome.storage.local.get(["dark_preset"], storage => {
    let tab = document.querySelector(".customize-dark");
    Object.keys(storage["dark_preset"]).forEach(key => {
        if (key !== "sidebar") {
            let c = tab.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            [color, text].forEach(changer => {
                changer.value = storage["dark_preset"][key];
                changer.addEventListener("input", function (e) {
                    changeCSS(key, e.target.value);
                });
            });
        } else {
            let mode = storage["dark_preset"][key].includes("url") ? "image" : storage["dark_preset"][key].includes("gradient") ? "gradient" : "solid";
            displaySidebarMode(mode, storage["dark_preset"][key]);
            let changeSidebar = () => {
                let c1 = tab.querySelector('#sidebar-color1 input[type="text"]').value.replace("c7", "");
                let c2 = tab.querySelector('#sidebar-color2 input[type="text"]').value.replace("c7", "");
                let url = tab.querySelector('#sidebar-image input[type="text"]').value;
                console.log("input detected", c1, c2, url);
                if (tab.querySelector("#radio-sidebar-image").checked) {
                    changeCSS(key, `linear-gradient(${c1}c7, ${c2}c7), center url("${url}")`);
                } else if (tab.querySelector("#radio-sidebar-gradient").checked) {
                    changeCSS(key, `linear-gradient(${c1}, ${c2})`);
                } else {
                    changeCSS(key, c1);
                }
            }
            ["#sidebar-color1", "#sidebar-color2"].forEach(group => {
                ['input[type="text"]', 'input[type="color"]'].forEach(input => {
                    document.querySelector(group + " " + input).addEventListener("input", e => {
                        ['input[type="text"]', 'input[type="color"]'].forEach(i => {
                            document.querySelector(group + " " + i).value = e.target.value;
                        });
                        changeSidebar();
                    });
                });
            });
            document.querySelector('#sidebar-image input[type="text"').addEventListener("change", () => changeSidebar());
        }
    });
});

["#radio-sidebar-image", "#radio-sidebar-gradient", "#radio-sidebar-solid"].forEach(radio => {
    document.querySelector(radio).addEventListener("click", () => {
        chrome.storage.local.get(["dark_preset"], storage => {
            let mode = radio === "#radio-sidebar-image" ? "image" : radio === "#radio-sidebar-gradient" ? "gradient" : "solid";
            displaySidebarMode(mode, storage["dark_preset"]["sidebar"]);
        });
    })
});

function refreshColors() {
    chrome.storage.local.get(["dark_preset"], storage => {
        Object.keys(storage["dark_preset"]).forEach(key => {
            let c = document.querySelector("#dp_" + key);
            let color = c.querySelector('input[type="color"]');
            let text = c.querySelector('input[type="text"]');
            color.value = storage["dark_preset"][key];
            text.value = storage["dark_preset"][key];
        });
        let mode = storage["dark_preset"]["sidebar"].includes("url") ? "image" : storage["dark_preset"]["sidebar"].includes("gradient") ? "gradient" : "solid";
        displaySidebarMode(mode, storage["dark_preset"]["sidebar"]);
    });
}

function changeCSS(name, color) {
    chrome.storage.local.get(["dark_preset", "dark_css"], storage => {
        storage["dark_preset"][name] = color;
        let chopped = storage["dark_css"].split("--bcstop:#000}")[1];
        let css = "";
        Object.keys(storage["dark_preset"]).forEach(key => {
            css += ("--bc" + key + ":" + storage["dark_preset"][key] + ";");
        });
        chrome.storage.local.set({ "dark_css": ":root{" + css + "--bcstop:#000}" + chopped, "dark_preset": storage["dark_preset"] }).then(() => refreshColors());
    });
}

function changeToPresetCSS(e, preset = null) {
    chrome.storage.local.get(['dark_css'], function (result) {
        const presets = {
            "lighter": { "background-0": "#272727", "background-1": "#353535", "background-2": "#404040", "borders": "#454545", "sidebar": "#353535", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
            "light": { "background-0": "#202020", "background-1": "#2e2e2e", "background-2": "#4e4e4e", "borders": "#404040", "sidebar": "#2e2e2e", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
            "dark": { "background-0": "#101010", "background-1": "#121212", "background-2": "#1a1a1a", "borders": "#272727", "sidebar": "#121212", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
            "darker": { "background-0": "#000000", "background-1": "#000000", "background-2": "#000000", "borders": "#000000", "sidebar": "#000000", "text-0": "#c5c5c5", "text-1": "#c5c5c5", "text-2": "#c5c5c5", "links": "#c5c5c5", "sidebar-text": "#c5c5c5" },
            "blue": { "background-0": "#14181d", "background-1": "#1a2026", "background-2": "#212930", "borders": "#2e3943", "sidebar": "#1a2026", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar-text": "#f5f5f5" },
            "mint": { "background-0": "#0f0f0f", "background-1": "#0c0c0c", "background-2": "#141414", "borders": "#1e1e1e", "sidebar": "#0c0c0c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#7CF3CB", "sidebar-text": "#f5f5f5" },
            "burn": { "background-0": "#ffffff", "background-1": "#ffffff", "background-2": "#ffffff", "borders": "#cccccc", "sidebar": "#ffffff", "text-0": "#cccccc", "text-1": "#cccccc", "text-2": "#cccccc", "links": "#cccccc", "sidebar-text": "#cccccc" },
            "unicorn": { "background-0": "#ff6090", "background-1": "#00C1FF", "background-2": "#FFFF00", "borders": "#FFFF00", "sidebar": "#00C1FF", "text-0": "#ffffff", "text-1": "#ffffff", "text-2": "#ffffff", "links": "#000000", "sidebar-text": "#ffffff" },
            "lightmode": { "background-0": "#ffffff", "background-1": "#f5f5f5", "background-2": "#d4d4d4", "borders": "#c7cdd1", "links": "#04ff00", "sidebar": "#04ff00", "sidebar-text": "#ffffff", "text-0": "#2d3b45", "text-1": "#919191", "text-2": "#a5a5a5" }
        }
        if (preset === null) preset = presets[e.target.id] || presets["default"];
        applyPreset(preset);
    });
}

function applyPreset(preset) {
    console.log("preset here -> ", preset);
    chrome.storage.local.get(["dark_preset", "dark_css"], storage => {
        let chopped = storage["dark_css"].split("--bcstop:#000}")[1];
        let css = "";
        Object.keys(preset).forEach(key => {
            css += ("--bc" + key + ":" + preset[key] + ";");
        });
        chrome.storage.local.set({ "dark_css": ":root{" + css + "--bcstop:#000}" + chopped, "dark_preset": preset }).then(() => refreshColors());
    });
}

function setToDefaults() {
    fetch(chrome.runtime.getURL('js/darkcss.json'))
        .then((resp) => resp.json())
        .then(function (result) {
            chrome.storage.local.set({ "dark_css": result["dark_css"], "dark_preset": { "background-0": "#161616", "background-1": "#1e1e1e", "background-2": "#262626", "borders": "#3c3c3c", "text-0": "#f5f5f5", "text-1": "#e2e2e2", "text-2": "#ababab", "links": "#56Caf0", "sidebar": "#1e1e1e", "sidebar-text": "#f5f5f5" } }).then(() => refreshColors());
        });
}

function makeElement(element, elclass, location, text) {
    let creation = document.createElement(element);
    creation.classList.add(elclass);
    creation.textContent = text;
    location.appendChild(creation);
    return creation
}

async function sendFromPopup(message, options = {}) {

    let response = new Promise((resolve, reject) => {
        chrome.tabs.query({ currentWindow: true }).then(async tabs => {
            for (let i = 0; i < tabs.length; i++) {
                try {
                    let res = await chrome.tabs.sendMessage(tabs[i].id, { "message": message, "options": options });
                    if (res) resolve(res);
                } catch (e) {
                }
            }
            resolve(null);
        });
    })

    return await response;
}