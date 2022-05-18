import { Command } from 'commander';

const program = new Command();

program
  .version('1.0.0')
  .name('my-command')
  .option('-d, --debug', 'enables verbose logging', false)
  .parse(process.argv);

program.parse();

console.log(program.opts());

// Function code for CLI goes here
