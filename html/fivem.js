let re = '(' + profList.join('|') + ')\\b'
const regTest = new RegExp(re, 'i');

const viewmodel = new Vue({
    el: "#app",
    vuetify: new Vuetify(),
    data: {
        characters: [],
        chardata: {},
        show: {
            loading: false,
            characters: false,
            register: false,
            delete: false
        },
        registerData: {
            date: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10),
            firstname: undefined,
            lastname: undefined,
            nationality: undefined,
            gender: undefined
        },
        allowDelete: false,
        dataPickerMenu: false,
        characterAmount: 0,
        loadingText: "",
        selectedCharacter: -1,
        dollar: Intl.NumberFormat('en-US'),
        translations: {},
        customNationality:false,
        nationalities: []
    },
    methods: {
        async fetchData() {
            const response = await fetch('https://countriesnow.space/api/v0.1/countries/');
            if(response){
                const data = await response.json();
                const result = data.data;

                const selectDrop = document.getElementById('nationality');
                
                result.forEach(obj => {
                    viewmodel.nationalities.push(obj.country);
                });
            }
        },
        click_character: function(idx, type) {
            this.selectedCharacter = idx

            if (this.characters[idx] !== undefined) {
                axios.post('https://qb-multicharacter/cDataPed', {
                    cData: this.characters[idx]
                });
            }
            else {
                axios.post('https://qb-multicharacter/cDataPed', {})
            }
        },

        save: function(date) {
            this.$refs.menu.save(date)
        },

        delete_character: function() {
            if (this.show.delete == true) {
                this.show.delete = false
                axios.post('https://qb-multicharacter/removeCharacter', {
                    citizenid: this.characters[this.selectedCharacter].citizenid
                });
            }
            else {
                if (this.show.characters == true && this.show.register == false) {
                    this.show.characters = false
                    this.show.delete = true
                }
            }
        },

        play_character: function() {
            if (this.selectedCharacter && this.selectedCharacter !== -1) {
                var data = this.characters[this.selectedCharacter]

                if (data !== undefined) {
                    axios.post('https://qb-multicharacter/selectCharacter', {
                        cData: data
                    });
                    setTimeout(function() {
                        viewmodel.show.characters = false
                    }, 500)
                }
                else {
                    this.registerData.firstname = undefined
                    this.registerData.lastname = undefined
                    this.registerData.nationality = undefined
                    this.registerData.gender = undefined
                    this.registerData.date = (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10)

                    this.show.characters = false
                    this.show.register = true
                }
            }

        },

        create_character: function() {
        const { firstname, lastname, gender, date } = this.registerData;

        // Validate if any field is empty
        if (!firstname || firstname.trim() === "" || 
            !lastname || lastname.trim() === "" || 
            !gender || gender.trim() === "" || 
            !date || date.trim() === "") {

            Swal.fire({
                icon: 'error',
                title: this.translate('ran_into_issue'),
                text: this.translate('forgotten_field'), // Custom error message for missing fields
                timer: 5000,
                timerProgressBar: true,
                showConfirmButton: false
            });
            return; // Stop further execution if validation fails
        }

        // Passed validation: create character
        this.show.register = false;
        axios.post('https://qb-multicharacter/createNewCharacter', {
            firstname: firstname.trim(),
            lastname: lastname.trim(),
            gender: gender.trim(),
            birthdate: date.trim(),
            cid: this.selectedCharacter
        }).catch(error => {
            Swal.fire({
                icon: 'error',
                title: this.translate('ran_into_issue'),
                text: error.message || this.translate('unknown_error'),
                timer: 5000,
                timerProgressBar: true,
                showConfirmButton: false
            });
        });
    },

    translate(phrase) {
        return this.translations[phrase] || phrase;
    }
},
    mounted () {
        this.fetchData()
        var loadingProgress = 0;
        var loadingDots = 0;
        window.addEventListener('message', function (event) {
            var data = event.data;
            switch(data.action) {
                case "ui":
                    viewmodel.customNationality = event.data.customNationality
                    viewmodel.translations = event.data.translations
                    viewmodel.characterAmount = data.nChar;
                    viewmodel.selectedCharacter = -1
                    viewmodel.show.register = false
                    viewmodel.show.delete = false
                    viewmodel.show.characters = false
                    viewmodel.allowDelete = event.data.enableDeleteButton
                    EnableDeleteButton = data.enableDeleteButton;
                    if (data.toggle) {
                        viewmodel.show.loading = true

                        viewmodel.loadingText = viewmodel.translate('retrieving_playerdata');
                        var DotsInterval = setInterval(function () {
                            loadingDots++;
                            loadingProgress++;
                            if (loadingProgress == 3) {
                                viewmodel.loadingText = viewmodel.translate('validating_playerdata')
                            }
                            if (loadingProgress == 4) {
                                viewmodel.loadingText = viewmodel.translate('retrieving_characters')
                            }
                            if (loadingProgress == 6) {
                                viewmodel.loadingText = viewmodel.translate('validating_characters')
                            }
                            if (loadingDots == 4) {
                                loadingDots = 0;
                            }
                        }, 500);

                        setTimeout(function () {
                            axios.post('https://qb-multicharacter/setupCharacters');
                            setTimeout(function () {
                                clearInterval(DotsInterval);
                                loadingProgress = 0;
                                viewmodel.loadingText = viewmodel.translate('retrieving_playerdata');
                                viewmodel.show.loading = false
                                viewmodel.show.characters = true
                                axios.post('https://qb-multicharacter/removeBlur');
                            }, 2000);
                        }, 2000);
                    }
                    break;
                case "setupCharacters":
                    var newChars = []
                    for (var i = 0; i < event.data.characters.length; i++) {
                        newChars[event.data.characters[i].cid] = event.data.characters[i]
                    }
                    viewmodel.characters = newChars
                    break;
                case "setupCharInfo":
                    viewmodel.chardata = event.data.chardata
                    break;
            }
        });
    }
    
});
