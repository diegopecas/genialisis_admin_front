# psyncronia

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.0.9.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Ejecutar con ip
ng serve --host 192.168.1.105 --port 4500 --disable-host-check

## Arbol
tree /F /A > estructura.txt

## Compilar genialisis_admin
ng build --configuration genialisis_admin
ng build --configuration genialisis_admin --output-path=dist/prod
ng build --configuration genialisis_admin_qa --output-path=dist/qa

# Start server 
ng serve --port 4100


## Ambientes — genialisis_admin (puerto 4100)

### Servidor local
```
ng serve genialisis_admin --port 4100                                   # development
ng serve genialisis_admin --configuration qa --port 4100
ng serve genialisis_admin --configuration genialisis_admin --port 4100
ng serve genialisis_admin --configuration production --port 4100
```

### Compilación
```
ng build genialisis_admin --configuration qa                 # dist/qa/browser
ng build genialisis_admin --configuration genialisis_admin   # dist/genialisis_admin/browser
ng build genialisis_admin --configuration production         # dist/prod/browser
ng build genialisis_admin                                    # dist/dev/browser
```