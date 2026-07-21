function generateName() {
    var colors = ['amaranth', 'amber', 'amethyst', 'apricot', 'aquamarine', 'azure', 'beige', 'black', 'blue', 'blush', 'bronze', 'brown', 'burgundy', 'cerulean', 'champagne', 'chartreuse', 'chocolate', 'cobalt', 'coffee', 'copper', 'coral', 'crimson', 'cyan', 'desert', 'electric', 'emerald', 'erin', 'gold', 'gray', 'green', 'harlequin', 'indigo', 'ivory', 'jade', 'jungle', 'lavender', 'lemon', 'lilac', 'lime', 'magenta', 'maroon', 'mauve', 'navy', 'ocher', 'olive', 'orange', 'orchid', 'peach', 'pear', 'periwinkle', 'pink', 'plum', 'purple', 'raspberry', 'red', 'rose', 'ruby', 'salmon', 'sangria', 'sapphire', 'scarlet', 'silver', 'slate', 'tan', 'taupe', 'teal', 'turquoise', 'violet', 'viridian', 'white', 'yellow'];
    var animals = ['alligator', 'bear', 'cat', 'chinchilla', 'cow', 'coyote', 'crocodile', 'dolphin', 'duck', 'fish', 'fox', 'gecko', 'hamster', 'hippopotamus', 'jaguar', 'leopard', 'liger', 'lion', 'lynx', 'monkey', 'ocelot', 'octopus', 'panther', 'penguin', 'pig', 'rhinoceros', 'seal', 'skunk', 'sloth', 'starfish', 'stingray', 'tiger', 'tortoise', 'toucan', 'turtle', 'whale', 'wolf'];
    var color = colors[Math.floor(Math.random() * colors.length)];
    var animal = animals[Math.floor(Math.random() * animals.length)];
    return color + '-' + animal;
}

window.initChatEngine = function() {
    // No-op stub to remove ChatEngine PubNub dependencies
};
