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
 * Controls cities and what happens inside of them
 * <p>
 * 
 * @(#)city.java   v1.20 08/04/10
 * 
 * @author: Rune P. Olsen
 * @version: 1.20 of April the 10th 2008
 * @see: This version is meant as a tribute to P. O. Frederiksen (http:/www.kaptajnkaper.dk)
 *
 * Ported to Javascript by Hans Milling
 */
function city(k)
{
    this.applet = k;
    this.currentPlayer = k.getCurrentPlayer();
    this.font = k.getCGAFont();

    this.currentCity=""; // Name of city where player currently is
    
    // Prices of this city (Men, Reparation, Cannons, Grain, Jewels)
    this.pResources = [ 0, 0, 0, 0, 0 ]; // Used for storing prices on resources
    this.pStandard = [ 10, 8, 100, 5, 50 ]; // Standard prices
    
    this.currentActionChar; // Used for visual presentation of chosen menu
    this.urrentBuySellAmount; // The amount the player currently buying or selling
    this.currentBuySellError; // Error to show user if something went wrong with the buy/sell
    
    this.currentAction; // What are the player doing right now
    this.tableStartY = 96;
    this.tableRowHeight = 44;
    this.colLabelX = 0;
    this.colAdd10X = 114;
    this.colAdd1X = 153;
    this.colValueX = 184;
    this.colSub1X = 256;
    this.colSub10X = 296;
    this.colPriceX = 336;
    this.buttonHitPadding = 4;
    this.buttonHitSize = 24;

    this.iconAdd10 = new Image();
    this.iconAdd10.src = "gfx/10up.png";
    this.iconAdd1 = new Image();
    this.iconAdd1.src = "gfx/up.png";
    this.iconSub1 = new Image();
    this.iconSub1.src = "gfx/down.png";
    this.iconSub10 = new Image();
    this.iconSub10.src = "gfx/10down.png";

    this.rows = [
        {
            key: "men",
            labelResource: "CityTableMen",
            priceResource: "City3",
            priceIndex: 0,
            getAmount: function() { return this.currentPlayer.getMen(); },
            setAmount: function(v) { this.currentPlayer.setMen(v); },
            canBuy: true,
            canSell: false,
            maxAmount: 499
        },
        {
            key: "repair",
            labelResource: "CityTableRepair",
            priceResource: "City4",
            priceIndex: 1,
            getAmount: function() { return this.currentPlayer.getReparation(); },
            setAmount: function(v) { this.currentPlayer.setReparation(v); },
            canBuy: true,
            canSell: false,
            maxAmount: 999
        },
        {
            key: "cannons",
            labelResource: "CityTableCannons",
            priceResource: "City5",
            priceIndex: 2,
            getAmount: function() { return this.currentPlayer.getCannons(); },
            setAmount: function(v) { this.currentPlayer.setCannons(v); },
            canBuy: true,
            canSell: true,
            maxAmount: 149
        },
        {
            key: "grain",
            labelResource: "CityTableGrain",
            priceResource: "City6",
            priceIndex: 3,
            getAmount: function() { return this.currentPlayer.getGrain(); },
            setAmount: function(v) { this.currentPlayer.setGrain(v); },
            canBuy: true,
            canSell: true,
            maxAmount: 699
        },
        {
            key: "jewels",
            labelResource: "CityTableJewels",
            priceResource: "City7",
            priceIndex: 4,
            getAmount: function() { return this.currentPlayer.getJewels(); },
            setAmount: function(v) { this.currentPlayer.setJewels(v); },
            canBuy: false,
            canSell: true,
            maxAmount: null
        }
    ];

    this.getTablePriceText = function(row, price)
    {
        var fullText = this.font.getResourceAsString(row.priceResource) || "";
        fullText = fullText.replace("{0}", "" + price);

        var open = fullText.indexOf("(");
        if (open >= 0)
        {
            return fullText.substring(open).trim();
        }

        var colon = fullText.indexOf(":");
        if (colon >= 0)
        {
            return fullText.substring(colon + 1).trim();
        }

        return fullText.trim();
    }
    this.leaveIconY = 176;

    /**
     * Constructor
     */

    /**
     * Fake paint method called from Applet.paint
     */
    this.paint = function(g)
    {
        this.font.setCurrentMode(cgafont.modes.CGA_MODE2);
        
        // Show information at top of screen
        g.drawImage(this.font.getResource("Map1", this.currentPlayer.getScore()), 41, 0);
        g.drawImage(this.font.getResource("Map2", this.currentPlayer.getScoreToNextPromotion(), this.currentPlayer.getMaxMovesBeforeNextPromotion()), 249, 0);

        // Show information at bottom of screen
        g.drawImage(this.font.getResource("Map6", this.currentPlayer.getMoves()), 25, 336);
        g.drawImage(this.font.getResource("Map7", this.currentPlayer.getMoney()), 217, 336);
        g.drawImage(this.font.getResource("Map8", this.currentPlayer.getGrain()), 441, 336);
        g.drawImage(this.font.getResource("Map9", this.currentPlayer.getMen()), 25, 368);
        g.drawImage(this.font.getResource("Map10", this.currentPlayer.getCannons()), 217, 368);
        g.drawImage(this.font.getResource("Map11", this.currentPlayer.getReparation()), 441, 368);
        
        // Show city menu
        g.drawImage(this.font.getResource("City1", this.currentCity), 0, 24);
        g.drawImage(this.font.getResource("City2", ""), 0, 40);

        this.drawTable(g);
        this.drawLeaveIcon(g);
        
        // Show error if buying or selling goes wrong
        if (this.currentBuySellError.length > 0)
            g.drawImage(this.font.getString(this.currentBuySellError), 0, 240);
    }

    /**
     * Controls keyboard character events
     */
    this.keyEvent = function(c)
    {
        if (c == "F1") // F1 pressed - show help menu
            this.applet.setCurrentAction(kaper.actionType.HELP);
        if (c == "6")
        {
            this.applet.setCurrentAction(kaper.actionType.MAP);
            this.currentPlayer.checkPlayerStatus();
            return;
        }
    }

    this.drawTable = function(g)
    {
        for (var i = 0; i < this.rows.length; i++)
        {
            var row = this.rows[i];
            var y = this.tableStartY + (i * this.tableRowHeight);
            var amount = row.getAmount.call(this);
            var price = this.pResources[row.priceIndex];

            g.drawImage(this.font.getResource(row.labelResource), this.colLabelX, y);
            if (row.canBuy)
            {
                g.drawImage(this.iconAdd10, this.colAdd10X, y-8);
                g.drawImage(this.iconAdd1, this.colAdd1X, y-8);
            }
            g.drawImage(this.font.getString(("" + amount).padStart(4, " ")), this.colValueX, y);
            if (row.canSell)
            {
                g.drawImage(this.iconSub1, this.colSub1X, y-8);
                g.drawImage(this.iconSub10, this.colSub10X, y-8);
            }
            g.drawImage(this.font.getString(this.getTablePriceText(row, price)), this.colPriceX, y);
        }
    }

    this.getLeaveArea = function()
    {
        var x = this.applet.osimg.width - 8 - gfx_leave.width;
        return {
            x: x,
            y: 24,
            width: gfx_leave.width,
            height: gfx_leave.height
        };
    }

    this.drawLeaveIcon = function(g)
    {
        var area = this.getLeaveArea();
        g.drawImage(gfx_leave, area.x, area.y);
    }

    this.isPointInsideArea = function(point, area)
    {
        return point.x >= area.x &&
               point.x <= area.x + area.width &&
               point.y >= area.y &&
               point.y <= area.y + area.height;
    }

    this.getButtonArea = function(x, y)
    {
        return {
            x: x - this.buttonHitPadding,
            y: y - this.buttonHitPadding,
            width: this.buttonHitSize,
            height: this.buttonHitSize
        };
    }

    this.getIconArea = function(icon, x, y)
    {
        return {
            x: x,
            y: y,
            width: icon.width || this.buttonHitSize,
            height: icon.height || this.buttonHitSize
        };
    }

    this.pointerEvent = function(point)
    {
        this.currentBuySellError = "";

        var action = this.getTableActionAtPoint(point);
        if (action)
        {
            this.applyTableAction(action.rowIndex, action.delta);
            return true;
        }

        var leaveArea = this.getLeaveArea();
        if (!this.isPointInsideArea(point, leaveArea))
            return false;

        this.applet.setCurrentAction(kaper.actionType.MAP);
        this.currentPlayer.checkPlayerStatus();
        return true;
    }

    this.getTableActionAtPoint = function(point)
    {
        for (var i = 0; i < this.rows.length; i++)
        {
            var row = this.rows[i];
            var y = this.tableStartY + (i * this.tableRowHeight);
            var add10 = this.getIconArea(this.iconAdd10, this.colAdd10X, y);
            var add1 = this.getIconArea(this.iconAdd1, this.colAdd1X, y);
            var sub1 = this.getIconArea(this.iconSub1, this.colSub1X, y);
            var sub10 = this.getIconArea(this.iconSub10, this.colSub10X, y);

            if (row.canBuy)
            {
                if (this.isPointInsideArea(point, add10)) return { rowIndex: i, delta: 10 };
                if (this.isPointInsideArea(point, add1)) return { rowIndex: i, delta: 1 };
            }
            if (row.canSell)
            {
                if (this.isPointInsideArea(point, sub1)) return { rowIndex: i, delta: -1 };
                if (this.isPointInsideArea(point, sub10)) return { rowIndex: i, delta: -10 };
            }
        }

        return null;
    }

    this.applyTableAction = function(rowIndex, delta)
    {
        var row = this.rows[rowIndex];
        var price = this.pResources[row.priceIndex];
        var amount = row.getAmount.call(this);

        if (delta > 0)
        {
            if (!row.canBuy)
            {
                playsound("beep");
                return;
            }

            var maxAffordable = Math.floor(this.currentPlayer.getMoney() / price);
            var allowed = Math.min(delta, maxAffordable);

            if (row.maxAmount != null)
                allowed = Math.min(allowed, Math.max(0, row.maxAmount - amount));

            if (allowed <= 0)
            {
                playsound("beep");
                return;
            }

            row.setAmount.call(this, amount + allowed);
            this.currentPlayer.setMoney(this.currentPlayer.getMoney() - (allowed * price));
            return;
        }

        if (!row.canSell)
        {
            playsound("beep");
            return;
        }

        var sellCount = Math.min(Math.abs(delta), amount);
        if (sellCount <= 0)
        {
            playsound("beep");
            return;
        }

        row.setAmount.call(this, amount - sellCount);
        this.currentPlayer.setMoney(this.currentPlayer.getMoney() + (sellCount * price));
    }
    
    // ------------------- Methods in this game object not specified by interface -------------------

    
    /**
     * Reset current action
     */
    this.resetAction = function()
    {
        this.currentAction = city.actionType.NONE;
        this.currentActionChar = 0;
        this.currentBuySellAmount = "";
        this.currentBuySellError = "";
    }
    
    /**
     * Player buys resources
     */
    this.buyResources = function()
    {
        var amount = Math.round(this.currentBuySellAmount);
        var total = amount * this.pResources[this.currentActionChar - 1];

        // Check if player got enough money
        if (total > this.currentPlayer.getMoney())
        {
            playsound("beep"); //Toolkit.getDefaultToolkit().beep();
            return;
        }
                
        // Check if trying to buy too many resources
        var tooMuch = false;
        switch (this.currentActionChar)
        {
            case 1:
                if (this.currentPlayer.getMen() + amount > 499) tooMuch = true;
                break;
            case 2:
                if (this.currentPlayer.getReparation() + amount > 999) tooMuch = true;
                break;
            case 3:
                if (this.currentPlayer.getCannons() + amount > 149) tooMuch = true;
                break;
            case 4:
                if (this.currentPlayer.getGrain() + amount > 699) tooMuch = true;
                break;
        }
        if (tooMuch)
        {
            playsound("beep"); //Toolkit.getDefaultToolkit().beep();
            return;
        }

        // Buy resources
        if (this.currentBuySellError.length == 0) // Should always be 0
        {
            this.currentPlayer.setMoney(this.currentPlayer.getMoney() - total);
            switch (this.currentActionChar)
            {
                case 1:
                    this.currentPlayer.setMen(this.currentPlayer.getMen() + amount);
                    break;
                case 2:
                    this.currentPlayer.setReparation(this.currentPlayer.getReparation() + amount);
                    break;
                case 3:
                    this.currentPlayer.setCannons(this.currentPlayer.getCannons() + amount);
                    break;
                case 4:
                    this.currentPlayer.setGrain(this.currentPlayer.getGrain() + amount);
                break;
            }
            this.resetAction();
        }
    }
    
    /**
     * Player sell resources
     */
    this.sellResources = function()
    {
        var amount = Math.round(this.currentBuySellAmount);
        var total = amount * this.pResources[this.currentActionChar - 1];

        // Check if trying to sell too many resources
        var tooMuch = false;
        switch (this.currentActionChar)
        {
            case 3:
                if (this.currentPlayer.getCannons() < amount) tooMuch = true;
                break;
            case 4:
                if (this.currentPlayer.getGrain() < amount) tooMuch = true;
                break;
            case 5:
                if (this.currentPlayer.getJewels() < amount) tooMuch = true;
                break;
        }
        if (tooMuch)
        {
            playsound("beep"); //Toolkit.getDefaultToolkit().beep();
            return;
        }

        // Sell resources
        if (this.currentBuySellError.length == 0) // Should always be 0
        {
            this.currentPlayer.setMoney(this.currentPlayer.getMoney() + total);
            switch (this.currentActionChar)
            {
                case 3:
                    this.currentPlayer.setCannons(this.currentPlayer.getCannons() - amount);
                    break;
                case 4:
                    this.currentPlayer.setGrain(this.currentPlayer.getGrain() - amount);
                    break;
                case 5:
                    this.currentPlayer.setJewels(this.currentPlayer.getJewels() - amount);
                break;
            }
            this.resetAction();
        }
    }
    

    // ------------------- PROPERTIES -------------------

    
    /**
     * Set information on new city
     */
    this.setNewCity = function(cityName)
    {
        this.currentCity = cityName;

        this.resetAction();
        
        // Calculates city prices
        //Random r = new Random();
        for (var i = 0; i < 5; i++)
            this.pResources[i] = Math.round((Math.random() + 0.8) * this.pStandard[i]);
    }
}

city.actionType = { NONE: 0, BUY: 1, SELL_1: 2, SELL_2: 3 };
