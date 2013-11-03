
build: components index.js
	@component build -o public/javascripts --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components template.js

.PHONY: clean
