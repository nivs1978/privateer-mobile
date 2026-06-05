/*
    This file is part of Privateer.

    Privateer is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Privateer is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Privateer.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
 * <p>
 * Kaptajn Kaper Applet version
 * (this class controls all parts besides the game itself,
 *  which is controlled by several game objects)
 * <p>
 * 
 * @(#)kaper.java   v1.20 08/04/10
 * 
 * @author: Rune P. Olsen
 * @version: 1.20 of April the 10th 2008
 * @see: This version is meant as a tribute to P. O. Frederiksen (http:/www.kaptajnkaper.dk)
 *
 * Ported to Javascript by Hans Milling
 */
function kaper()
{
    this.currentVersion = "1.0 (2026/05/15)"; // Current version of this game
    
    this.osimg = null; // Offscreen image to be used for double buffering
    this.osgrp = null; // Offscreen graphics to be used for double buffering
    this.APPLET_WIDTH = 640; // Width of Applet
    this.APPLET_HEIGHT = 400; // Height of Applet

    this.font = null; // Emulation of the old CGA font
    this.currentPlayer = null; // Holds all player data
    
    this.animation = null;
    this.animationRepaint = false;
    
    // Game objects
    this.gMap = null;
    this.gPromote = null;
    this.gMist = null;
    this.gAttack = null;
    this.gHarbor = null;
    this.gCity = null;
    this.gHelp = null;

    this.currentStep = null; // Where in the game are the player
    this.currentAction = null; // If playing, what is the current game action
    this.endScreenInputUnlockedAt = 0; // Timestamp when end screen key input is allowed again

    this.highScoreStorageKey = "privateer.highscore.v1";
    this.languageStorageKey = "privateer.language.v1";
    this.nameStorageKey = "privateer.name.v1";
    this.saveGameStorageKey = "privateer.savegame.v1";
    this.highScore = { score: 0, name: "" }; // Original game stores one record holder
    this.nameInput = null;
    this.flagSelectionY = 200;
    this.flagSelectionWidth = 62;
    this.flagSelectionHeight = 42;
    this.flagSelectionSpacing = 60;
    this.swipeStartPoint = null;
    this.swipeMinDistance = 24;
    this.dragLastPoint = null;
    this.mouseDragActive = false;
    this.returnToGameAfterLanguageSelect = false;

    var okaper = this; // To be able to access this object from the keyboard functions

    this.addKeyListener = function()
    {
        if (document.addEventListener) {
            document.addEventListener('keydown', this.keyPressed, false);
 //           document.addEventListener('keypress', this.keyPressed, false);
        }
        else if (document.attachEvent) {
            document.attachEvent('keydown', this.keyPressed);
 //           document.attachEvent('keypress', this.keyPressed);
        }
    }

    this.addPointerListener = function()
    {
        this.osimg.addEventListener("click", this.handleWelcomePointer, false);
        this.osimg.addEventListener("mousedown", this.handleMouseDown, false);
        this.osimg.addEventListener("mousemove", this.handleMouseMove, false);
        this.osimg.addEventListener("mouseup", this.handleMouseUp, false);
        this.osimg.addEventListener("mouseleave", this.handleMouseUp, false);
        this.osimg.addEventListener("touchstart", this.handleTouchStart, { passive: false });
        this.osimg.addEventListener("touchmove", this.handleTouchMove, { passive: false });
        this.osimg.addEventListener("touchend", this.handleTouchEnd, { passive: false });
        this.osimg.addEventListener("touchcancel", this.handleTouchCancel, false);
    }

    this.isShootDragActive = function()
    {
        return okaper.currentStep == kaper.stepType.GAME_PLAYING &&
               okaper.currentAction == kaper.actionType.ATTACK &&
               okaper.gAttack &&
               okaper.gAttack.getCurrentAttack() == attack.attackType.SHOOT;
    }

    this.applyShootDrag = function(dxClient, dyClient)
    {
        if (!okaper.isShootDragActive())
        {
            return false;
        }

        var rect = okaper.osimg.getBoundingClientRect();
        var scaleX = okaper.osimg.width / rect.width;
        var scaleY = okaper.osimg.height / rect.height;
        var dxCanvas = dxClient * scaleX;
        var dyCanvas = dyClient * scaleY;

        okaper.gAttack.getCurrentShoot().dragAim(dxCanvas, dyCanvas);
        okaper.repaint();
        return true;
    }

    this.handleTouchStart = function(e)
    {
        if (!e.touches || e.touches.length === 0)
        {
            return;
        }

        var touch = e.touches[0];
        okaper.swipeStartPoint = { x: touch.clientX, y: touch.clientY };
        if (okaper.isShootDragActive())
        {
            okaper.dragLastPoint = { x: touch.clientX, y: touch.clientY };
            if (e.preventDefault) e.preventDefault();
        }
    }

    this.handleTouchMove = function(e)
    {
        if (!e.touches || e.touches.length === 0)
        {
            return;
        }

        var touch = e.touches[0];

        if (okaper.isShootDragActive() && okaper.dragLastPoint)
        {
            var dxClient = touch.clientX - okaper.dragLastPoint.x;
            var dyClient = touch.clientY - okaper.dragLastPoint.y;
            okaper.dragLastPoint = { x: touch.clientX, y: touch.clientY };
            if (okaper.applyShootDrag(dxClient, dyClient) && e.preventDefault) e.preventDefault();
            return;
        }

        if (!okaper.swipeStartPoint)
        {
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING &&
            okaper.currentAction == kaper.actionType.HARBOR &&
            okaper.gHarbor.getCurrentAction() == harbor.actionType.SAILING)
        {
            var dx = touch.clientX - okaper.swipeStartPoint.x;
            var dy = touch.clientY - okaper.swipeStartPoint.y;
            var screenWidth = okaper.osimg.getBoundingClientRect().width;
            var dragThreshold = Math.max(12, screenWidth * 0.01);

            if (Math.abs(dx) > Math.abs(dy) && okaper.gHarbor.dragEvent(dx, dragThreshold))
            {
                okaper.swipeStartPoint = { x: touch.clientX, y: touch.clientY };
                if (e.preventDefault) e.preventDefault();
                okaper.repaint();
            }
        }
    }

    this.getSwipeDirectionKey = function(dx, dy)
    {
        var distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < okaper.swipeMinDistance)
        {
            return null;
        }

        var angle = Math.atan2(dy, dx) * (180 / Math.PI);

        if (angle >= -22.5 && angle < 22.5) return "6"; // Right
        if (angle >= 22.5 && angle < 67.5) return "3"; // Down-right
        if (angle >= 67.5 && angle < 112.5) return "2"; // Down
        if (angle >= 112.5 && angle < 157.5) return "1"; // Down-left
        if (angle >= 157.5 || angle < -157.5) return "4"; // Left
        if (angle >= -157.5 && angle < -112.5) return "7"; // Up-left
        if (angle >= -112.5 && angle < -67.5) return "8"; // Up
        return "9"; // Up-right
    }

    this.handleTouchEnd = function(e)
    {
        okaper.dragLastPoint = null;

        if (!okaper.swipeStartPoint || !e.changedTouches || e.changedTouches.length === 0)
        {
            okaper.swipeStartPoint = null;
            return;
        }

        var touch = e.changedTouches[0];
        var dx = touch.clientX - okaper.swipeStartPoint.x;
        var dy = touch.clientY - okaper.swipeStartPoint.y;
        okaper.swipeStartPoint = null;

        if (okaper.currentStep == kaper.stepType.GAME_LOST || okaper.currentStep == kaper.stepType.HIGHSCORE)
        {
            okaper.handleWelcomePointer(e);
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING && okaper.currentAction == kaper.actionType.ATTACK)
        {
            okaper.handleWelcomePointer(e);
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING && okaper.currentAction == kaper.actionType.MIST)
        {
            okaper.handleWelcomePointer(e);
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING && okaper.currentAction == kaper.actionType.HARBOR)
        {
            if (okaper.gHarbor.getCurrentAction() == harbor.actionType.SAILING)
            {
                if (e.preventDefault) e.preventDefault();
            }
            else
            {
                okaper.handleWelcomePointer(e);
            }
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING &&
            (okaper.currentAction == kaper.actionType.PROMOTE ||
             okaper.currentAction == kaper.actionType.CITY ||
             okaper.currentAction == kaper.actionType.HELP))
        {
            okaper.handleWelcomePointer(e);
            return;
        }

        if (okaper.currentStep != kaper.stepType.GAME_PLAYING || okaper.currentAction != kaper.actionType.MAP)
        {
            return;
        }

        var directionKey = okaper.getSwipeDirectionKey(dx, dy);
        if (!directionKey)
        {
            return;
        }

        if (e.preventDefault) e.preventDefault();
        okaper.gMap.keyEvent(directionKey);
        okaper.repaint();
    }

    this.handleTouchCancel = function()
    {
        okaper.swipeStartPoint = null;
        okaper.dragLastPoint = null;
    }

    this.handleMouseDown = function(e)
    {
        if (!okaper.isShootDragActive())
        {
            return;
        }

        okaper.mouseDragActive = true;
        okaper.dragLastPoint = { x: e.clientX, y: e.clientY };
        if (e.preventDefault) e.preventDefault();
    }

    this.handleMouseMove = function(e)
    {
        if (!okaper.mouseDragActive || !okaper.dragLastPoint)
        {
            return;
        }

        var dxClient = e.clientX - okaper.dragLastPoint.x;
        var dyClient = e.clientY - okaper.dragLastPoint.y;
        okaper.dragLastPoint = { x: e.clientX, y: e.clientY };

        if (okaper.applyShootDrag(dxClient, dyClient) && e.preventDefault)
        {
            e.preventDefault();
        }
    }

    this.handleMouseUp = function()
    {
        okaper.mouseDragActive = false;
        okaper.dragLastPoint = null;
    }

    this.createNameInput = function()
    {
        this.nameInput = document.createElement("input");
        this.nameInput.type = "text";
        this.nameInput.maxLength = 20;
        this.nameInput.autocomplete = "off";
        this.nameInput.autocapitalize = "none";
        this.nameInput.autocorrect = "off";
        this.nameInput.spellcheck = false;

        this.nameInput.style.position = "fixed";
        this.nameInput.style.left = "-1000px";
        this.nameInput.style.top = "-1000px";
        this.nameInput.style.width = "1px";
        this.nameInput.style.height = "1px";
        this.nameInput.style.opacity = "0";
        this.nameInput.style.border = "0";
        this.nameInput.style.padding = "0";
        this.nameInput.style.background = "transparent";
        this.nameInput.style.color = "transparent";

        this.nameInput.addEventListener("input", function() {
            okaper.syncNameInputToPlayer();
            okaper.repaint();
        });

        this.nameInput.addEventListener("keydown", function(e) {
            if (okaper.currentStep == kaper.stepType.INTRO_ENTER_NAME && e.key == "Enter")
            {
                if (e.preventDefault) e.preventDefault();
                if (okaper.currentPlayer.getName().length > 0)
                {
                    okaper.saveNameSetting(okaper.currentPlayer.getName());
                    okaper.setCurrentStep(kaper.stepType.GAME_PLAYING);
                    okaper.repaint();
                }
            }
        });

        document.body.appendChild(this.nameInput);
    }

    this.syncNameInputToPlayer = function()
    {
        if (!this.nameInput || !this.currentPlayer)
        {
            return;
        }

        this.currentPlayer.setName(this.nameInput.value || "");
        if (this.nameInput.value !== this.currentPlayer.getName())
        {
            this.nameInput.value = this.currentPlayer.getName();
        }
    }

    this.syncPlayerToNameInput = function()
    {
        if (!this.nameInput || !this.currentPlayer)
        {
            return;
        }

        this.nameInput.value = this.currentPlayer.getName() || "";
    }

    this.focusNameInput = function()
    {
        if (!this.nameInput)
        {
            return;
        }

        this.syncPlayerToNameInput();
        this.nameInput.focus();

        var len = this.nameInput.value.length;
        this.nameInput.setSelectionRange(len, len);
    }

    this.blurNameInput = function()
    {
        if (!this.nameInput)
        {
            return;
        }

        this.nameInput.blur();
    }

    this.getFlagSelectionAreas = function()
    {
        var totalWidth = (this.flagSelectionWidth * 2) + this.flagSelectionSpacing;
        var flagsStartX = Math.floor((this.osimg.width - totalWidth) / 2);

        return {
            english: {
                x: flagsStartX,
                y: this.flagSelectionY,
                width: this.flagSelectionWidth,
                height: this.flagSelectionHeight
            },
            danish: {
                x: flagsStartX + this.flagSelectionWidth + this.flagSelectionSpacing,
                y: this.flagSelectionY,
                width: this.flagSelectionWidth,
                height: this.flagSelectionHeight
            }
        };
    }

    this.getCanvasPointFromEvent = function(e)
    {
        var source = e;
        if (e.touches && e.touches.length > 0)
        {
            source = e.touches[0];
        }
        else if (e.changedTouches && e.changedTouches.length > 0)
        {
            source = e.changedTouches[0];
        }

        var rect = okaper.osimg.getBoundingClientRect();
        var scaleX = okaper.osimg.width / rect.width;
        var scaleY = okaper.osimg.height / rect.height;

        return {
            x: (source.clientX - rect.left) * scaleX,
            y: (source.clientY - rect.top) * scaleY
        };
    }

    this.isPointInsideArea = function(point, area)
    {
        return point.x >= area.x &&
               point.x <= area.x + area.width &&
               point.y >= area.y &&
               point.y <= area.y + area.height;
    }

    this.handleWelcomePointer = function(e)
    {
        if (okaper.currentStep == kaper.stepType.GAME_LOST)
        {
            if (Date.now() < okaper.endScreenInputUnlockedAt)
            {
                return;
            }

            if (e.preventDefault) e.preventDefault();
            okaper.setCurrentStep(kaper.stepType.HIGHSCORE);
            okaper.repaint();
            return;
        }

        if (okaper.currentStep == kaper.stepType.HIGHSCORE)
        {
            if (Date.now() < okaper.endScreenInputUnlockedAt)
            {
                return;
            }

            if (e.preventDefault) e.preventDefault();
            okaper.currentPlayer.resetPlayer();
            okaper.gMap.resetMap();
            okaper.setCurrentAction(kaper.actionType.MAP);
            okaper.setCurrentStep(kaper.stepType.INTRO_WELCOME);
            okaper.repaint();
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING && okaper.currentAction == kaper.actionType.ATTACK)
        {
            var attackPoint = okaper.getCanvasPointFromEvent(e);
            if (okaper.gAttack.pointerEvent(attackPoint))
            {
                if (e.preventDefault) e.preventDefault();
                okaper.repaint();
            }
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING && okaper.currentAction == kaper.actionType.MIST)
        {
            var mistPoint = okaper.getCanvasPointFromEvent(e);
            if (okaper.gMist.pointerEvent(mistPoint))
            {
                if (e.preventDefault) e.preventDefault();
                okaper.repaint();
            }
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING && okaper.currentAction == kaper.actionType.PROMOTE)
        {
            if (okaper.gPromote.pointerEvent())
            {
                if (e.preventDefault) e.preventDefault();
                okaper.repaint();
            }
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING && okaper.currentAction == kaper.actionType.HARBOR)
        {
            if (okaper.gHarbor.pointerEvent())
            {
                if (e.preventDefault) e.preventDefault();
                okaper.repaint();
            }
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING && okaper.currentAction == kaper.actionType.CITY)
        {
            var cityPoint = okaper.getCanvasPointFromEvent(e);
            if (okaper.gCity.pointerEvent(cityPoint))
            {
                if (e.preventDefault) e.preventDefault();
                okaper.repaint();
            }
            return;
        }

        if (okaper.currentStep == kaper.stepType.GAME_PLAYING && okaper.currentAction == kaper.actionType.HELP)
        {
            if (okaper.gHelp.pointerEvent())
            {
                if (e.preventDefault) e.preventDefault();
                okaper.repaint();
            }
            return;
        }

        if (okaper.currentStep == kaper.stepType.TITLE_SCREEN)
        {
            if (e.preventDefault) e.preventDefault();
            var savedName = okaper.loadNameSetting();
            if (savedName && savedName.length > 0)
            {
                okaper.currentPlayer.setName(savedName);
                okaper.syncPlayerToNameInput();
                okaper.setCurrentStep(kaper.stepType.GAME_PLAYING);
            }
            else
            {
                okaper.setCurrentStep(kaper.stepType.INTRO_ENTER_NAME);
            }
            okaper.repaint();
            return;
        }

        if (okaper.currentStep == kaper.stepType.INTRO_ENTER_NAME)
        {
            if (e.preventDefault) e.preventDefault();
            okaper.focusNameInput();
            return;
        }

        if (okaper.currentStep != kaper.stepType.INTRO_WELCOME)
        {
            return;
        }

        var point = okaper.getCanvasPointFromEvent(e);
        var areas = okaper.getFlagSelectionAreas();

        if (okaper.isPointInsideArea(point, areas.english))
        {
            if (e.preventDefault) e.preventDefault();
            playsoundFromGesture("intro");
            okaper.font.setCurrentLocale(cgafont.localeType.ENGLISH);
            okaper.saveLanguageSetting("en");
            okaper.updateBurgerLabels();
            if (okaper.returnToGameAfterLanguageSelect)
            {
                okaper.returnToGameAfterLanguageSelect = false;
                okaper.setCurrentAction(kaper.actionType.MAP);
                okaper.setCurrentStep(kaper.stepType.GAME_PLAYING);
            }
            else
            {
                okaper.setCurrentStep(kaper.stepType.TITLE_SCREEN);
            }
            okaper.repaint();
            return;
        }

        if (okaper.isPointInsideArea(point, areas.danish))
        {
            if (e.preventDefault) e.preventDefault();
            playsoundFromGesture("intro");
            okaper.font.setCurrentLocale(cgafont.localeType.DANISH);
            okaper.saveLanguageSetting("da");
            okaper.updateBurgerLabels();
            if (okaper.returnToGameAfterLanguageSelect)
            {
                okaper.returnToGameAfterLanguageSelect = false;
                okaper.setCurrentAction(kaper.actionType.MAP);
                okaper.setCurrentStep(kaper.stepType.GAME_PLAYING);
            }
            else
            {
                okaper.setCurrentStep(kaper.stepType.TITLE_SCREEN);
            }
            okaper.repaint();
        }
    }

    // ------------------- Save game -------------------

    this.saveGame = function()
    {
        if (this.currentStep !== kaper.stepType.GAME_PLAYING || this.currentAction !== kaper.actionType.MAP)
            return;

        var p = this.currentPlayer;
        var data = {
            score:                     p.score,
            moves:                     p.moves,
            difficulty:                p.difficulty,
            posX:                      p.posX,
            posY:                      p.posY,
            money:                     p.money,
            cannons:                   p.cannons,
            men:                       p.men,
            reparation:                p.reparation,
            jewels:                    p.jewels,
            grain:                     p.grain,
            scoreToNextPromotion:      p.scoreToNextPromotion,
            maxMovesBeforeNextPromotion: p.maxMovesBeforeNextPromotion,
            eventExp:                  p.eventExp,
            battlesWon:                p.battlesWon,
            battlesLost:               p.battlesLost,
            prizeMen:                  p.prizeMen,
            prizeMoney:                p.prizeMoney,
            mapData:                   this.gMap.currentMapData
        };
        try { localStorage.setItem(this.saveGameStorageKey, JSON.stringify(data)); }
        catch (err) {}
    }

    this.loadSaveGame = function()
    {
        try
        {
            var raw = localStorage.getItem(this.saveGameStorageKey);
            if (!raw) return false;

            var d = JSON.parse(raw);
            if (!d || typeof d.score !== "number") return false;

            var p = this.currentPlayer;
            p.score                       = d.score || 0;
            p.moves                       = d.moves || 0;
            p.difficulty                  = d.difficulty || 2;
            p.posX                        = d.posX || 10;
            p.posY                        = d.posY || 13;
            p.money                       = d.money || 0;
            p.cannons                     = d.cannons || 0;
            p.men                         = d.men || 0;
            p.reparation                  = d.reparation || 0;
            p.jewels                      = d.jewels || 0;
            p.grain                       = d.grain || 0;
            p.scoreToNextPromotion        = d.scoreToNextPromotion || 0;
            p.maxMovesBeforeNextPromotion = d.maxMovesBeforeNextPromotion || 0;
            p.eventExp                    = d.eventExp || 2;
            p.battlesWon                  = d.battlesWon || 1;
            p.battlesLost                 = d.battlesLost || 1;
            p.prizeMen                    = d.prizeMen || 0;
            p.prizeMoney                  = d.prizeMoney || 0;
            p.deathReason                 = player.causeOfDeath.NOT_YET;

            if (d.mapData && d.mapData.length) this.gMap.currentMapData = d.mapData;

            var savedName = this.loadNameSetting();
            if (savedName) p.name = savedName;
            this.syncPlayerToNameInput();
            return true;
        }
        catch (err) { return false; }
    }

    this.deleteSaveGame = function()
    {
        try { localStorage.removeItem(this.saveGameStorageKey); }
        catch (err) {}
    }

    // ------------------- Language / Name persistence -------------------

    this.loadLanguageSetting = function()
    {
        try { return localStorage.getItem(this.languageStorageKey); }
        catch (err) { return null; }
    }

    this.saveLanguageSetting = function(locale)
    {
        try { localStorage.setItem(this.languageStorageKey, locale); }
        catch (err) {}
    }

    this.loadNameSetting = function()
    {
        try { return localStorage.getItem(this.nameStorageKey); }
        catch (err) { return null; }
    }

    this.saveNameSetting = function(name)
    {
        try { localStorage.setItem(this.nameStorageKey, name || ""); }
        catch (err) {}
    }

    // ------------------- Burger menu -------------------

    this.toggleBurgerMenu = function()
    {
        if (!(this.currentStep === kaper.stepType.GAME_PLAYING && this.currentAction === kaper.actionType.MAP))
            return;

        var menu = document.getElementById("burger-menu");
        if (!menu) return;
        if (menu.style.display === "none" || menu.style.display === "")
        {
            this.updateBurgerLabels();
            var saveBtn = document.getElementById("burger-item-save");
            if (saveBtn)
                saveBtn.disabled = !(this.currentStep === kaper.stepType.GAME_PLAYING && this.currentAction === kaper.actionType.MAP);
            menu.style.display = "block";
        }
        else
        {
            menu.style.display = "none";
        }
    }

    this.closeBurgerMenu = function()
    {
        var menu = document.getElementById("burger-menu");
        if (menu) menu.style.display = "none";
    }

    this.updateBurgerVisibility = function()
    {
        var btn = document.getElementById("burger-btn");
        if (!btn) return;

        var show = (this.currentStep === kaper.stepType.GAME_PLAYING && this.currentAction === kaper.actionType.MAP);
        btn.style.display = show ? "flex" : "none";
        if (!show) this.closeBurgerMenu();
    }

    this.updateBurgerLabels = function()
    {
        var res = document.kaperresources;
        if (!res) return;
        var ids = { "burger-item-new": "BurgerMenuNew", "burger-item-save": "BurgerMenuSave",
                    "burger-item-name": "BurgerMenuName", "burger-item-language": "BurgerMenuLanguage" };
        for (var id in ids)
        {
            var el = document.getElementById(id);
            if (el) el.textContent = res[ids[id]] || el.textContent;
        }
    }

    this.burgerNew = function()
    {
        this.closeBurgerMenu();
        this.currentPlayer.resetPlayer();
        this.gMap.resetMap();
        this.setCurrentAction(kaper.actionType.MAP);
        this.animationRepaint = false;
        this.setCurrentStep(kaper.stepType.TITLE_SCREEN);
        this.repaint();
    }

    this.burgerSave = function()
    {
        this.closeBurgerMenu();
        this.saveGame();
    }

    this.burgerName = function()
    {
        this.closeBurgerMenu();
        this.currentPlayer.setName("");
        this.syncPlayerToNameInput();
        this.animationRepaint = false;
        this.setCurrentStep(kaper.stepType.INTRO_ENTER_NAME);
        this.repaint();
    }

    this.burgerLanguage = function()
    {
        this.closeBurgerMenu();
        this.returnToGameAfterLanguageSelect = true;
        this.animationRepaint = false;
        this.setCurrentStep(kaper.stepType.INTRO_WELCOME);
        this.repaint();
    }

    /**
     * Set all global object variables to initial values
     */
    this.init = function()
    {
        // This is a workaround for a security conflict with some browsers
        // including some versions of Netscape & Internet Explorer which do 
        // not allow access to the AWT system event queue which JApplets do 
        // on startup to check access.
//        JRootPane rootPane = this.getRootPane();    
//        rootPane.putClientProperty("defeatSystemEventQueueCheck", Boolean.TRUE);
    
        // Creates an offscreen image to be used for double buffer drawing
//        this.maincontainer = document.createElement("div");
//        this.maincontainer.style.width = "100%";
        this.osimg = document.createElement("canvas"); // createImage(APPLET_WIDTH, APPLET_HEIGHT);
        this.osimg.width=640;
        this.osimg.height=400;

        this.osimg.style.paddingLeft = 0;
        this.osimg.style.paddingRight = 0;
        this.osimg.style.marginLeft = 0;
        this.osimg.style.marginRight = 0;
        this.osimg.style.display = "block";
        this.osimg.style.width = "min(100vw, calc(100dvh * 1.6))";
        this.osimg.style.height = "auto";
        this.osimg.style.imageRendering = "pixelated";
        this.osimg.style.msInterpolationMode = "nearest-neighbor";
        this.osimg.style.touchAction = "manipulation";

//        this.maincontainer.appendChild(this.osimg);
        //document.getElementById("maincontainer").appendChild(this.osimg);
        document.getElementsByTagName("body")[0].appendChild(this.osimg);
        this.osgrp = this.osimg.getContext("2d"); // osimg.getGraphics();
        this.osgrp.imageSmoothingEnabled = false;
        this.osgrp.webkitImageSmoothingEnabled = false;
        this.osgrp.mozImageSmoothingEnabled = false;
        this.osgrp.msImageSmoothingEnabled = false;
        //osgrp.setXORMode(new Color(0,0,168));
        this.createNameInput();

        // Add keyboard listener (the Applet handles all keyboard input)
        this.addKeyListener();
        this.addPointerListener();
        
        // Set first step and action of game
        this.currentStep = kaper.stepType.INTRO_WELCOME;
        this.currentAction = kaper.actionType.MAP;
        
        // Load resources and initialize a new player
        this.font = new cgafont(this);
        this.currentPlayer = new player(this);
        this.loadHighScore();

        // Initialize game objects
        this.gMap = new map(this);
        this.gPromote = new promote(this);
        this.gMist = new mist(this);
        this.gAttack = new attack(this);
        this.gHarbor = new harbor(this);
        this.gCity = new city(this);
        this.gHelp = new help(this);

        // Apply saved language; if found skip language selection screen
        var savedLocale = this.loadLanguageSetting();
        if (savedLocale)
        {
            this.font.setCurrentLocale(savedLocale);
            this.currentStep = kaper.stepType.TITLE_SCREEN;
        }

        window.privateerApp = this;
        this.updateBurgerLabels();

        // If a save game exists, load it and go straight to the map
        if (this.loadSaveGame())
        {
            this.setCurrentStep(kaper.stepType.GAME_PLAYING);
            this.setCurrentAction(kaper.actionType.MAP);
        }

        this.updateBurgerVisibility();

    }
    
    /**
     * The main paint method which call game obejcts paint methods
     * (this methods controls the start and end of game, game objects controls the game itself)
     */
    this.paint = function()
    {
        // Set background for orignal CGA blue color

        this.osgrp.fillStyle = getColor(0, 0, 168); // this.osgrp.setColor();
        this.osgrp.fillRect(0, 0, this.osimg.width, this.osimg.height); // this.osgrp.fillRect(0, 0, APPLET_WIDTH, APPLET_HEIGHT);

        // Draw graphics of the current step
        switch (this.currentStep)
        {
            case kaper.stepType.INTRO_WELCOME:
                this.font.setCurrentMode(cgafont.modes.CGA_MODE1);
                this.osgrp.drawImage(this.font.getResource("Welcome1"), 128, 32);
                this.osgrp.drawImage(this.font.getResource("Welcome2"), 32, 80);
                this.osgrp.drawImage(this.font.getResource("Welcome3"), 32, 96);
                this.osgrp.drawImage(this.font.getResource("Welcome4"), 32, 112);


                this.osgrp.drawImage(this.font.getResource("Welcome9"), 64, 144);
                this.osgrp.drawImage(this.font.getResource("Welcome10"), 128, 160);
                this.osgrp.drawImage(this.font.getString(this.font.getResourceAsString("Welcome8")), 96, 360);
                this.osgrp.drawImage(this.font.getString("v" + this.currentVersion), 196, 384);

                var recordName = this.highScore.name && this.highScore.name.length > 0 ? this.highScore.name : "Nelson himself!";
                var recordValue = this.highScore.score || 256;
                this.osgrp.drawImage(this.font.getResource("RecordLabel"), 40, 296);
                this.osgrp.drawImage(this.font.getResource("RecordHolderLabel"), 144, 296);                
                this.osgrp.drawImage(this.font.getString(((""+recordValue).padStart(5, " "))), 24, 312);
                this.osgrp.drawImage(this.font.getString(recordName), 144, 312);
                var flagAreas = this.getFlagSelectionAreas();
                this.osgrp.drawImage(gfx_uk_flag, flagAreas.english.x, flagAreas.english.y);
                this.osgrp.drawImage(gfx_dk_flag, flagAreas.danish.x, flagAreas.danish.y);

                break;

            case kaper.stepType.INTRO_ENTER_NAME:
                this.syncNameInputToPlayer();
                this.font.setCurrentMode(cgafont.modes.CGA_MODE1);
                var labelImg = this.font.getResource("PlayerName1");
                this.osgrp.drawImage(labelImg, 0, 112);
                var label_x_offset = labelImg.width + 32;
                this.osgrp.drawImage(img_ship_map_mode1, label_x_offset, 112);
                var nameImg = this.font.getResource("PlayerName2");
                this.osgrp.drawImage(nameImg, 0, 128);
                var name = this.currentPlayer.getName();
                var showCursor = (Date.now() % 1000) < 500;
                var cursorChar = showCursor ? String.fromCharCode(219) : " ";
                var nameWithCursor = name + cursorChar;
                var name_x_offset = nameImg.width + 16;
                this.osgrp.drawImage(this.font.getString(nameWithCursor), name_x_offset, 128);
                break;
                
            case kaper.stepType.TITLE_SCREEN:
                var img = eval("img_title_" + this.font.getCurrentLocale());
                this.osgrp.drawImage(img, 12, 0);
                break;
                
            case kaper.stepType.GAME_PLAYING:
                // The actual game is made with game objects which are called from here
                switch (this.currentAction)
                {
                    case kaper.actionType.MAP:
                        this.gMap.paint(this.osgrp);
                        break;
                    case kaper.actionType.PROMOTE:
                        this.gPromote.paint(this.osgrp);
                        break;
                    case kaper.actionType.MIST:
                        this.gMist.paint(this.osgrp);
                        break;
                    case kaper.actionType.ATTACK:
                        this.gAttack.paint(this.osgrp);
                        break;
                    case kaper.actionType.HARBOR:
                        this.gHarbor.paint(this.osgrp);
                        break;
                    case kaper.actionType.CITY:
                        this.gCity.paint(this.osgrp);
                        break;
                    case kaper.actionType.HELP:
                        this.gHelp.paint(this.osgrp);
                        break;
                }
                break;
                
            case kaper.stepType.GAME_LOST: // This below part is very confusing due to the many reasons for player death
                this.font.setCurrentMode(cgafont.modes.CGA_MODE2);
                var moreLines = 0; // Depending on death reason, extra lines may need to be added
                var temp= null; // Used when building up text strings
                
                if (this.currentPlayer.getDeathReason() == player.causeOfDeath.TOO_MANY_MOVES)
                {
                    this.osgrp.drawImage(this.font.getResource("CauseOfDeath_TOO_MANY_MOVES1"), 0, 0);
                    this.osgrp.drawImage(this.font.getResource("CauseOfDeath_TOO_MANY_MOVES2"), 0, 32);
                    this.osgrp.drawImage(this.font.getResource("CauseOfDeath_TOO_MANY_MOVES3"), 0, 64);
                    this.osgrp.drawImage(this.font.getResource("CauseOfDeath_TOO_MANY_MOVES4"), 0, 80);
                    this.osgrp.drawImage(this.font.getResource("CauseOfDeath_TOO_MANY_MOVES5"), 0, 112);
                }
                else
                {
                    this.osgrp.drawImage(this.font.getResource("EndGame1"), 0, 64);
                    this.osgrp.drawImage(this.font.getResource("EndGame2"), 0, 80);
                    this.osgrp.drawImage(this.font.getResource("EndGame3", this.currentPlayer.getScore(), this.currentPlayer.getMoney()), 0, 96);

                    if (this.currentPlayer.getDeathReason() != player.causeOfDeath.TOO_FEW_RESOURCES)
                    {
                        this.osgrp.drawImage(this.font.getResource("CauseOfDeath_" + this.currentPlayer.getDeathReason()), 0, 144);
                        this.osgrp.drawImage(this.font.getResource("CauseOfDeath"), 0, 160);
                        moreLines = 64;
                    }
                }
                
                this.osgrp.drawImage(this.font.getResource("EndGame4", this.currentPlayer.getMen()), 0, 144 + moreLines);
                this.osgrp.drawImage(this.font.getResource("EndGame5", this.currentPlayer.getReparation()), 0, 160 + moreLines);
                break;
                
            case kaper.stepType.HIGHSCORE:
                this.font.setCurrentMode(cgafont.modes.CGA_MODE2);
                var highScoreHolder = this.highScore.name && this.highScore.name.length > 0 ? this.highScore.name : "Nelson himself!";
                this.osgrp.drawImage(this.font.getResource("HighScore1", this.currentPlayer.getScore()), 192, 160);
                this.osgrp.drawImage(this.font.getResource("RecordLabel", this.highScore.score), 192, 192);
                this.osgrp.drawImage(this.font.getResource("RecordHolderLabel", highScoreHolder), 192, 208);
                break;
        }
        
        // Draws double buffered image from memory onto screen
        //g.drawImage(this.osimg, 0, 0);
    }
    
    this.update = function() {
        this.paint(); // Update screen without erasing it first (no flickering)
    }

    this.repaint = function() {
        this.update();
    }

    /**
     * Runnable events
     * (this controls all animations in game)
     */

/*
    this.start()
    {
        animation = new Thread(this);
        if (animation != null)
        {
            animation.start();
        }
    }

    public void stop()
    {
        if (animation != null)
        {
            // animation.stop(); // Java depricated
            animation = null;
        }
    }
*/
    this.run = function()
    {
        //Thread thisThread = Thread.currentThread();
        // Listen for animation events during entire game
        //while (animation == thisThread)
        //{
            // Wait time if no animation occurring
            // (No need to do fast updates when not doing animations)
            var sleepTime = 200; 
            
            // Check if any animation is currently being drawed
            if (this.animationRepaint && this.currentAction == kaper.actionType.ATTACK &&
                this.gAttack.getCurrentBoard().getCurrentState() == board.stateType.SHIP_ANIMATION)
            {
                // Boarding enemy animation happening
                this.gAttack.getCurrentBoard().showShipAnimation();
                sleepTime = 20;
                this.repaint();
            }
            else if (this.animationRepaint && this.currentAction == kaper.actionType.ATTACK &&
                     this.gAttack.getCurrentBoard().getCurrentState() == board.stateType.FLAG_ANIMATION)
            {
                // Enemy surrender animation
                this.gAttack.getCurrentBoard().showFlagAnimation();
                sleepTime = 10;
                this.repaint();
            }
            else if (this.animationRepaint && this.currentAction == kaper.actionType.HARBOR &&
                     this.gHarbor.getCurrentAction() == harbor.actionType.SAILING)
            {
                // Sailing through harbour animation
                this.gHarbor.showSailingAnimation();
                // Faster animation later in game (made as in the original version)
                sleepTime = 150 - (this.currentPlayer.getDifficulty() - 2) * 2;
                this.repaint();
            }
            else if (this.currentStep == kaper.stepType.INTRO_ENTER_NAME)
            {
                // Keep redrawing while entering name so the cursor can blink.
                sleepTime = 100;
                this.repaint();
            }
            
        // Sleep until next frame update
            var runthis = this;
            setTimeout(function(){ runthis.run(); }, sleepTime);
/*            try
            {
                thisThread.sleep(sleepTime);
            }
            catch (Exception ex) {}*/
        //}
    }
    
    /**
     * If asked the Applet should return information about the game
     */
    this.getAppletInfo = function()
    {
        return "Title: Java Applet version of Kaptajn Kaper i Kattegat\nAuthor: Rune P. Olsen\nVersion: " + currentVersion;
    }

    this.normalizeKey = function(e)
    {
        var key = e.key;

        // Keep numpad behavior consistent when NumLock is on/off.
        if (e.location === 3)
        {
            switch (e.code)
            {
                case "Numpad0": return "0";
                case "Numpad1": return "1";
                case "Numpad2": return "2";
                case "Numpad3": return "3";
                case "Numpad4": return "4";
                case "Numpad5": return "5";
                case "Numpad6": return "6";
                case "Numpad7": return "7";
                case "Numpad8": return "8";
                case "Numpad9": return "9";
                case "NumpadEnter": return "Enter";
            }
        }

        return key;
    }


    /**
     * KeyListener events
     * (this controls key events for the start and end of game,
     *  and passes key events on to game objects while in the game itself)
     */
    //public void keyReleased(KeyEvent e) {} // Not used

    this.keyPressed = function (e)
    {
        var c = okaper.normalizeKey(e);
        var endScreenLocked = Date.now() < okaper.endScreenInputUnlockedAt;

        // Keep browser shortcuts from stealing game keys.
        if (c == "F1" || c == "F2" || c == "Escape")
        {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
            e.returnValue = false;
            e.cancelBubble = true;
        }

        /*if (c != KeyEvent.CHAR_UNDEFINED)
        {*/

        switch (okaper.currentStep)
            {
            case kaper.stepType.INTRO_WELCOME:
                    if (c.toLowerCase() == 'c')
                    {
                        okaper.clearHighScore();
                        okaper.repaint();
                    }
                    break;
                    
            case kaper.stepType.INTRO_ENTER_NAME:
                var nameInputHasFocus = okaper.nameInput && document.activeElement == okaper.nameInput;

                if (c == "Enter" && okaper.currentPlayer.getName().length > 0) // Return key - start game
                    {
                        okaper.saveNameSetting(okaper.currentPlayer.getName());
                        okaper.setCurrentStep(kaper.stepType.GAME_PLAYING);
                        okaper.repaint();
                    }
                    else if (nameInputHasFocus)
                    {
                        okaper.syncNameInputToPlayer();
                        okaper.repaint();
                    }
                    else if (c == "Backspace") // Backspace key
                    {
                        if (okaper.currentPlayer.getName().length > 0)
                        {
                            okaper.currentPlayer.setName(okaper.currentPlayer.getName().substring(0, okaper.currentPlayer.getName().length - 1));
                            okaper.repaint();
                        }
                    }
                    else if (c.length==1)// Normal characters
                    {
                        okaper.currentPlayer.setName(okaper.currentPlayer.getName() + c);
                        okaper.repaint();
                    }
                    break;
                    
            case kaper.stepType.TITLE_SCREEN:
                    okaper.setCurrentStep(kaper.stepType.INTRO_ENTER_NAME); // Go to player name entry
                    okaper.repaint();
                    break;
                    
            case kaper.stepType.GAME_PLAYING:
                switch (okaper.currentAction)
                    {
                        case kaper.actionType.MAP:
                            okaper.gMap.keyEvent(c);
                            break;
                        case kaper.actionType.PROMOTE:
                            okaper.gPromote.keyEvent(c);
                            break;
                        case kaper.actionType.MIST:
                            okaper.gMist.keyEvent(c);
                            break;
                        case kaper.actionType.ATTACK:
                            okaper.gAttack.keyEvent(c);
                            break;
                        case kaper.actionType.HARBOR:
                            okaper.gHarbor.keyEvent(c);
                            break;
                        case kaper.actionType.CITY:
                            okaper.gCity.keyEvent(c);
                            break;
                        case kaper.actionType.HELP:
                            okaper.gHelp.keyEvent(c);
                            break;
                    }
                    okaper.repaint();
                    break;
                    
            case kaper.stepType.GAME_LOST:
                    // End-screen progression is pointer-only.
                    break;
                    
            case kaper.stepType.HIGHSCORE:
                    // End-screen progression is pointer-only.
                    break;
            }
            
            //e.consume(); // Remove from list of typed keys
        //}
    }
    
    
    // ------------------- PROPERTIES -------------------
   
    
    /**
     * Property for game step
     */
    this.setCurrentStep = function(step)
    {
        var wasEndScreen = this.currentStep == kaper.stepType.GAME_LOST || this.currentStep == kaper.stepType.HIGHSCORE;
        var isEndScreen = step == kaper.stepType.GAME_LOST || step == kaper.stepType.HIGHSCORE;
        var isNameEntry = step == kaper.stepType.INTRO_ENTER_NAME;

        this.currentStep = step;

        if (step == kaper.stepType.HIGHSCORE)
        {
            this.trySetHighScore(this.currentPlayer.getScore(), this.currentPlayer.getName());
        }

        if (step == kaper.stepType.GAME_LOST)
        {
            this.deleteSaveGame();
        }

        // Ignore accidental key presses for a short time when entering end-game screens.
        if (isEndScreen && !wasEndScreen)
        {
            this.endScreenInputUnlockedAt = Date.now() + 5000;
        }
        else if (!isEndScreen)
        {
            this.endScreenInputUnlockedAt = 0;
        }

        if (isNameEntry)
        {
            this.focusNameInput();
        }
        else
        {
            this.blurNameInput();
        }

        this.updateBurgerVisibility();
    }
    
    this.loadHighScore = function()
    {
        try
        {
            var raw = localStorage.getItem(this.highScoreStorageKey);
            if (!raw) return;

            var parsed = JSON.parse(raw);
            if (parsed && typeof parsed.score === "number")
            {
                this.highScore.score = Math.max(0, Math.floor(parsed.score));
                this.highScore.name = parsed.name ? ("" + parsed.name) : "";
            }
        }
        catch (err)
        {
            // Ignore storage/parsing errors and keep defaults.
        }
    }

    this.saveHighScore = function()
    {
        try
        {
            localStorage.setItem(this.highScoreStorageKey, JSON.stringify(this.highScore));
        }
        catch (err)
        {
            // Ignore write errors when storage is not available.
        }
    }

    this.clearHighScore = function()
    {
        this.highScore.score = 0;
        this.highScore.name = "";

        try
        {
            localStorage.removeItem(this.highScoreStorageKey);
        }
        catch (err)
        {
            // Ignore storage errors when localStorage is unavailable.
        }
    }

    this.trySetHighScore = function(score, name)
    {
        var normalizedScore = Math.max(0, Math.floor(score || 0));
        if (normalizedScore <= this.highScore.score) return;

        this.highScore.score = normalizedScore;
        this.highScore.name = name ? ("" + name) : "";
        this.saveHighScore();
    }

    /**
     * Properties for game action
     */
    this.getCurrentAction = function()
    {
        return this.currentAction;
    }

    this.setCurrentAction = function(action)
    {
        this.currentAction = action;
        this.updateBurgerVisibility();
    }

    /**
     * Property for current player
     */
    this.getCurrentPlayer = function()
    {
        return this.currentPlayer;
    }
    
    /**
     * Property for cgafont
     */
    this.getCGAFont = function()
    {
        return this.font;
    }
    
    /**
     * Property for map
     */
    this.getMap = function()
    {
        return this.gMap;
    }

    /**
     * Property for harbor
     */
    this.getHarbor = function()
    {
        return this.gHarbor;
    }
    
    /**
     * Property for city
     */
    this.getCity = function()
    {
        return this.gCity;
    }
}

kaper.actionType = { MAP: 0, PROMOTE: 1, MIST: 2, ATTACK: 3, HARBOR: 4, CITY: 5, HELP: 6 };
kaper.stepType = { INTRO_WELCOME: 0, INTRO_ENTER_NAME: 1, TITLE_SCREEN: 2, GAME_PLAYING: 3, GAME_LOST: 4, HIGHSCORE: 5 };
