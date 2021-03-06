const scoreDiv = document.getElementsByClassName('score')[0];

import { System } from 'ecsy';
import { ControllableBasket, Moving, Egg, Hearts, FloatingCloud } from './Components';
import * as THREE from 'three';

class BasketMoveSystem extends System {
    init() {}
    execute( delta, time ) {

        this.queries.playerBaskets.results.forEach( ( entity ) => {

            const basket = entity.getObject3D();
            const controlComponent = entity.getComponent( ControllableBasket );

            const leftMoveX = basket.position.x - controlComponent.speed * delta;
            const righttMoveX = basket.position.x + controlComponent.speed * delta;

            if ( controlComponent.input.left && leftMoveX >= controlComponent.boundries.minX ) {
                basket.position.x = leftMoveX;
            }
            if ( controlComponent.input.right && righttMoveX <= controlComponent.boundries.maxX ) {
                basket.position.x = righttMoveX;
            }
        });
    }
}
BasketMoveSystem.queries = {
    playerBaskets: { components: [ ControllableBasket ] }
};

class MoveSystem extends System {
    init() {
        this.vec3 = new THREE.Vector3();
    }
    execute( delta, time ) {

        let basketEntity, heartsEntity;

        this.queries.playerBaskets.results.forEach( ( entity ) => {
            basketEntity = entity;
        });

        this.queries.hearts.results.forEach( ( entity ) => {
            heartsEntity = entity;
        });

        this.queries.movingObjects.results.forEach( ( entity ) => {

            const obj = entity.getObject3D();
            const movingComponent = entity.getComponent( Moving );
            const controlComponent = basketEntity.getMutableComponent( ControllableBasket );

            const velocity = ( movingComponent.velocity + movingComponent.acceleration * time ) * delta;
            // console.log( velocity );
            obj.position.add( this.vec3.copy( movingComponent.direction ).multiplyScalar( velocity ) );

            if ( obj.position.y < movingComponent.boundries.min.y ) { // Egg lower boundry
                obj.position.set( // Reset egg
                    movingComponent.boundries.min.x + (movingComponent.boundries.max.x - movingComponent.boundries.min.x) * Math.random(),
                    movingComponent.boundries.max.y + Math.random() * (movingComponent.respawnRange + time),
                    0
                );
                // Remove a heart
                if ( entity.getComponent( Egg ).points >= 0 ) {
                    // remove life and heart
                    controlComponent.lives--;
                    const heartsContainer = heartsEntity.getObject3D();
                    heartsContainer.remove( heartsContainer.children[ heartsContainer.children.length - 1 ] );

                    if ( controlComponent.lives <= 0 ) { // check for game over
                        document.dispatchEvent( new Event('Game Over') );
                    }
                }
            }
        });
    }
}
MoveSystem.queries = {
    movingObjects: { components: [ Moving ] },
    playerBaskets: { components: [ ControllableBasket ] },
    hearts: { components: [ Hearts ] },
};

class EggCollisionSystem extends System {
    init() {}
    execute( delta, time ) {

        let basketEntity, heartsEntity;

        this.queries.playerBaskets.results.forEach( ( entity ) => {
            basketEntity = entity;
        });

        this.queries.hearts.results.forEach( ( entity ) => {
            heartsEntity = entity;
        });

        this.queries.eggs.results.forEach( ( entity ) => {

            const egg = entity.getObject3D();
            const basket = basketEntity.getObject3D();
            const controlComponent = basketEntity.getMutableComponent( ControllableBasket );
            const movingComponent = entity.getComponent( Moving );
            const eggComponent = entity.getComponent( Egg );

            if( egg.position.distanceTo( basket.position ) < 0.75 ) {
                egg.position.set(
                    movingComponent.boundries.min.x + (movingComponent.boundries.max.x - movingComponent.boundries.min.x) * Math.random(),
                    movingComponent.boundries.max.y + Math.random() * movingComponent.respawnRange,
                    0
                );

                controlComponent.score += eggComponent.points;

                scoreDiv.textContent = 'Score: ' + controlComponent.score;

                if ( eggComponent.points < 0 ) { // black egg
                    controlComponent.lives--;
                    const heartsContainer = heartsEntity.getObject3D();
                    heartsContainer.remove( heartsContainer.children[ heartsContainer.children.length - 1 ] );
                }
            }
        });
    }
}
EggCollisionSystem.queries = {
    eggs: { components: [ Egg ] },
    playerBaskets: { components: [ ControllableBasket ] },
    hearts: { components: [ Hearts ] },
};

class CloudFloatingSystem extends System {
    init() {
        this.vec3 = new THREE.Vector3();
    }
    execute( delta, time ) {

        this.queries.clouds.results.forEach( ( entity ) => {

            const obj = entity.getObject3D();
            const cloudComponent = entity.getComponent( FloatingCloud );

            const velocity = cloudComponent.velocity * delta;
            obj.position.add( this.vec3.copy( cloudComponent.direction ).multiplyScalar( velocity ) );

            if ( obj.position.x > cloudComponent.boundries.max.x ) { // Reached boundry, transform back to beginning (scrolling)
                
                obj.position.x = cloudComponent.boundries.min.x - cloudComponent.respawnRange * Math.random();
            }
        });
    }
}
CloudFloatingSystem.queries = {
    clouds: { components: [ FloatingCloud ] }
};

export { BasketMoveSystem, MoveSystem, EggCollisionSystem, CloudFloatingSystem };