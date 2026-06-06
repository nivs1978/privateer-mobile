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
 * Controls enemy attacks
 * <p>
 * 
 * @(#)attack.java   v1.20 08/04/10
 * 
 * @author: Rune P. Olsen
 * @version: 1.20 of April the 10th 2008
 * @see: This version is meant as a tribute to P. O. Frederiksen (http:/www.kaptajnkaper.dk)
 *
 * Ported to Javascript by Hans Milling
 */


/**
 * Constructor
 */
function attack(k)
{
    this.sunkMen = 0; // No of men thrown out when enemy ship is sunk
    this.choiceIconSpacing = 60;
    this.encounterChoiceY = 160;
    this.withdrawChoiceY = 48;
    this.attackModeChoiceY = 80;
    this.surrenderChoiceY = 192;

    this.applet = k;
    this.currentPlayer = k.getCurrentPlayer();
    this.font = k.getCGAFont();

    // The two types of attack
    this.currentEnemy = new enemy(this.applet, this); // Prepare first enemy
    this.currentAttack = attack.attackType.NONE; // No attack started yet. Where in the attack are we

    // Ready both types of attack
    this.currentShoot = new shoot(this.applet, this.currentEnemy, this);
    this.currentBoard = new board(this.applet, this.currentEnemy, this);
        
    // No men sunk at this time
    this.sunkMen = 0;
    
    /**
     * Fake paint method called from Applet.paint
     */
    this.paint = function(g)
    {
        var temp = null;
        
        switch (this.currentAttack)
        {
            case attack.attackType.NONE:
                this.font.setCurrentMode(cgafont.modes.CGA_MODE2);
                this.applet.getMap().paint(g); // Paint stats in bottom of screen
                g.drawImage(this.font.getResource("Attack1"), 0, 0);
                g.drawImage(this.font.getResource("Attack2"), 0, 16);
                g.drawImage(this.font.getResource("Attack3", this.currentEnemy.getName()), 0, 32);
                g.drawImage(this.font.getResource("Attack4", this.currentPlayer.getRankType1(), this.currentPlayer.getName()), 0, 64);
                g.drawImage(this.font.getResource("Attack5"), 0, 80);
                g.drawImage(this.font.getResource("Attack6"), 0, 96);
                this.drawChoiceIcons(g, 160);

                break;
                
            case attack.attackType.ATTACK:
                this.font.setCurrentMode(cgafont.modes.CGA_MODE2);
                this.applet.getMap().paint(g); // Paint stats in bottom of screen
                g.drawImage(this.font.getResource("Attacking1"), 0, 0);
                g.drawImage(this.font.getResource("Attacking2"), 0, 16);
                this.drawAttackModeIcons(g, this.attackModeChoiceY);
                
                break;
                
            case attack.attackType.SHOOT:
                this.currentShoot.paint(g);
                break;

            case attack.attackType.BOARD:
                this.currentBoard.paint(g);
                break;
                
            case attack.attackType.WITHDRAW:
                this.font.setCurrentMode(cgafont.modes.CGA_MODE2);
                this.applet.getMap().paint(g); // Paint stats in bottom of screen
                this.drawChoiceIcons(g, 48);
                break;
                
            case attack.attackType.WON_SURRENDER:
                playsound("taps");
            case attack.attackType.WON_PRIZING:
                this.font.setCurrentMode(cgafont.modes.CGA_MODE1);
                g.drawImage(this.font.getResource("AttackSurrender1"), 0, 0);
                g.drawImage(this.font.getResource("AttackSurrender2", this.currentEnemy.getMoney()), 0, 16);
                if (this.currentEnemy.getMen() > 1)
                    g.drawImage(this.font.getResource("AttackSurrender3", this.currentEnemy.getMen()), 0, 32);
                else
                    g.drawImage(this.font.getResource("AttackSurrender4"), 0, 32);
                g.drawImage(this.font.getResource("AttackSurrender5", this.currentEnemy.getGrain()), 0, 48);
                g.drawImage(this.font.getResource("AttackSurrender6"), 0, 64);
                g.drawImage(this.font.getResource("AttackSurrender7"), 0, 96);
                g.drawImage(this.font.getResource("AttackSurrender8", this.currentEnemy.getPrizeCost()), 0, 112);
                g.drawImage(this.font.getResource("AttackSurrender9", this.currentPlayer.getMen()), 0, 128);
                g.drawImage(this.font.getResource("AttackSurrender10"), 0, 144);
                g.drawImage(this.font.getResource("AttackSurrender11"), 0, 160);
                if (this.currentAttack == attack.attackType.WON_SURRENDER)
                {
                    this.drawSurrenderChoiceIcons(g, this.surrenderChoiceY);
                }
                if (this.currentAttack == attack.attackType.WON_PRIZING)
                {
                    g.drawImage(this.font.getResource("AttackSurrender12"), 0, 192);
                }
                break;

            case attack.attackType.WON_SUNK:
                playsound("taps");
                this.font.setCurrentMode(cgafont.modes.CGA_MODE1);
                g.drawImage(this.font.getResource("AttackSunk1"), 0, 0);
                var moreLines = 0;
                if (this.sunkMen > 0)
                {
                    g.drawImage(this.font.getResource("AttackSunk2", this.sunkMen), 0, 16);
                    this.moreLines += 16;
                }
                break;
        }
    }
    
    /**
     * Controls keyboard character events
     */
    this.keyEvent = function(c)
    {
        switch (this.currentAttack)
        {
            case attack.attackType.NONE:
            case attack.attackType.WITHDRAW:
                // Encounter choice is handled by touch/click icons.
                break;
            
            case attack.attackType.ATTACK:
                // Board/Shoot choice is handled by touch/click icons.
                break;
                
            case attack.attackType.SHOOT:
            case attack.attackType.BOARD:
                if (this.currentAttack == attack.attackType.BOARD)
                    this.currentBoard.keyEvent(c);
                else
                    this.currentShoot.keyEvent(c);
                
                if (this.currentPlayer.getDeathReason() != player.causeOfDeath.NOT_YET)
                    this.resetAttack(attack.type.LOST);

                break;
             
            case attack.attackType.WON_SURRENDER:
                // Surrender choice is handled by touch/click icons.
                break;
                
            case attack.attackType.WON_PRIZING:
                // Continue from this screen is pointer-only.
                break;

            case attack.attackType.WON_SUNK:
                // Continue from this screen is pointer-only.
                break;
        }
    }

    this.getChoiceAreas = function(leftImage, rightImage, y)
    {
        var leftWidth = leftImage.width;
        var rightWidth = rightImage.width;
        var totalWidth = leftWidth + this.choiceIconSpacing + rightWidth;
        var startX = Math.floor((this.applet.osimg.width - totalWidth) / 2);

        return {
            left: {
                x: startX,
                y: y,
                width: leftWidth,
                height: leftImage.height
            },
            right: {
                x: startX + leftWidth + this.choiceIconSpacing,
                y: y,
                width: rightWidth,
                height: rightImage.height
            }
        };
    }

    this.drawChoiceIcons = function(g, y)
    {
        var areas = this.getChoiceAreas(gfx_attack, gfx_flee, y);
        g.drawImage(gfx_attack, areas.left.x, areas.left.y);
        g.drawImage(gfx_flee, areas.right.x, areas.right.y);
    }

    this.drawAttackModeIcons = function(g, y)
    {
        var areas = this.getChoiceAreas(gfx_board, gfx_shoot, y);
        g.drawImage(gfx_board, areas.left.x, areas.left.y);
        g.drawImage(gfx_shoot, areas.right.x, areas.right.y);
    }

    this.drawSurrenderChoiceIcons = function(g, y)
    {
        var areas = this.getChoiceAreas(gfx_sink, gfx_prize, y);
        g.drawImage(gfx_sink, areas.left.x, areas.left.y);
        g.drawImage(gfx_prize, areas.right.x, areas.right.y);
    }

    this.isPointInsideArea = function(point, area)
    {
        return point.x >= area.x &&
               point.x <= area.x + area.width &&
               point.y >= area.y &&
               point.y <= area.y + area.height;
    }

    this.pointerEvent = function(point)
    {
        var y = null;
        var leftImage = null;
        var rightImage = null;
        if (this.currentAttack == attack.attackType.NONE)
        {
            y = this.encounterChoiceY;
            leftImage = gfx_attack;
            rightImage = gfx_flee;
        }
        else if (this.currentAttack == attack.attackType.WITHDRAW)
        {
            y = this.withdrawChoiceY;
            leftImage = gfx_attack;
            rightImage = gfx_flee;
        }
        else if (this.currentAttack == attack.attackType.ATTACK)
        {
            y = this.attackModeChoiceY;
            leftImage = gfx_board;
            rightImage = gfx_shoot;
        }
        else if (this.currentAttack == attack.attackType.BOARD)
        {
            return this.currentBoard.pointerEvent(point);
        }
        else if (this.currentAttack == attack.attackType.SHOOT)
        {
            return this.currentShoot.pointerEvent(point);
        }
        else if (this.currentAttack == attack.attackType.WON_SURRENDER)
        {
            y = this.surrenderChoiceY;
            leftImage = gfx_sink;
            rightImage = gfx_prize;
        }
        else if (this.currentAttack == attack.attackType.WON_PRIZING)
        {
            this.advanceAfterBattle();
            return true;
        }
        else if (this.currentAttack == attack.attackType.WON_SUNK)
        {
            this.advanceAfterBattle();
            return true;
        }
        else
            return false;

        var areas = this.getChoiceAreas(leftImage, rightImage, y);

        if (this.isPointInsideArea(point, areas.left))
        {
            if (this.currentAttack == attack.attackType.ATTACK)
                this.chooseAttackModeOption(true);
            else if (this.currentAttack == attack.attackType.WON_SURRENDER)
                this.chooseSurrenderOption(true);
            else
                this.chooseEncounterOption(true);
            return true;
        }

        if (this.isPointInsideArea(point, areas.right))
        {
            if (this.currentAttack == attack.attackType.ATTACK)
                this.chooseAttackModeOption(false);
            else if (this.currentAttack == attack.attackType.WON_SURRENDER)
                this.chooseSurrenderOption(false);
            else
                this.chooseEncounterOption(false);
            return true;
        }

        return false;
    }

    this.chooseEncounterOption = function(attackSelected)
    {
        // Encountering an enemy is an event (which means experience).
        if (this.currentAttack == attack.attackType.NONE)
            this.currentPlayer.addToExperience();

        if (attackSelected)
            this.currentAttack = attack.attackType.ATTACK;
        else
        {
            playsound("flee");
            this.resetAttack(attack.type.LOST);
        }
    }

    this.chooseAttackModeOption = function(boardSelected)
    {
        if (boardSelected)
        {
            this.currentAttack = attack.attackType.BOARD;
            this.currentBoard.resetBoarding();
            this.currentBoard.showShipAnimation();
        }
        else
        {
            this.currentAttack = attack.attackType.SHOOT;
            this.currentShoot.prepareShooting();
        }
    }

    this.chooseSurrenderOption = function(sinkSelected)
    {
        // Original game always used the value 50 to indicate a fought battle.
        this.applet.getMap().setCurrentMapDataValue(50);

        // Give player enemy resources.
        this.currentPlayer.setMoney(this.currentPlayer.getMoney() + this.currentEnemy.getMoney());
        this.currentPlayer.addToScore(Math.floor(this.currentEnemy.getMoney() / 10));
        var grain = this.currentEnemy.getGrain();
        if (grain == 1) grain = 2;
        this.currentPlayer.setGrain(this.currentPlayer.getGrain() + grain);

        if (!sinkSelected) // Prize enemy ship
        {
            this.currentAttack = attack.attackType.WON_PRIZING;
            //Random r = new Random();
            if (this.currentPlayer.getDifficulty() < Math.floor(Math.random() * 16)) // Sometimes prizing goes wrong
            {
                this.currentPlayer.addToPrizeMen(this.currentEnemy.getPrizeCost());
                this.currentPlayer.addToPrizeMoney(this.currentEnemy.getMoney());
            }
        }
        else // Sink enemy ship
        {
            this.currentAttack = attack.attackType.WON_SUNK;
            var newMen = this.currentPlayer.getMen() + this.currentEnemy.getMen();
            if (newMen > 500)
            {
                this.currentPlayer.setMen(500);
                this.sunkMen = newMen - 500;
            }
            else
                this.currentPlayer.setMen(newMen);
        }
    }

    this.advanceAfterBattle = function()
    {
        if (this.currentAttack == attack.attackType.WON_PRIZING)
        {
            // Cannot do these things before all earlier data has been put on screen for the player.
            this.currentPlayer.setMen(this.currentPlayer.getMen() - this.currentEnemy.getPrizeCost());
            this.resetAttack(attack.type.WON);
            this.currentPlayer.checkPlayerStatus(); // Check if player didn't have enough men for prizing
        }
        else if (this.currentAttack == attack.attackType.WON_SUNK)
        {
            // Original game always used the value 50 to indicate a fought battle.
            this.applet.getMap().setCurrentMapDataValue(50);
            this.resetAttack(attack.type.WON);
        }
    }
    
    // ------------------- Methods in this game object not specified by interface -------------------
    
    /**
     * Reset attack
     */
    this.resetAttack = function(t)
    {
        if (t == attack.type.LOST)
            this.currentPlayer.addToBattlesLost();
        else
            this.currentPlayer.addToBattlesWon();

        this.currentAttack = attack.attackType.NONE;
        this.currentEnemy.prepareNextEnemy();
        this.applet.setCurrentAction(kaper.actionType.MAP);
        this.sunkMen = 0;
    }
    
    // ------------------- PROPERTIES -------------------
    
    /**
     * Properties for current attack type
     */
    this.getCurrentAttack = function()
    {
        return this.currentAttack;
    }
    this.setCurrentAttack = function(a)
    {
        this.currentAttack = a;
    }

    /**
     * Property for current board
     */
    this.getCurrentBoard = function()
    {
        return this.currentBoard;
    }

    this.getCurrentShoot = function()
    {
        return this.currentShoot;
    }
}

attack.attackType = { NONE:0, ATTACK:1, SHOOT:2, BOARD:3, WITHDRAW:4, WON_SURRENDER:5, WON_PRIZING:6, WON_SUNK:7 };
attack.type = { LOST:0, WON:1 };
