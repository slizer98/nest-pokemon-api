import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ){}
  
  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error, 'create')
    }
  }

  findAll( paginationDto: PaginationDto ) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.pokemonModel
      .find()
      .limit(limit)
      .skip(offset)
      .sort({no:1})
      .select('-__v');
  }

  async findOne(term: string) {

    let pokemon: Pokemon;

    if (!isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({no: term})
    }

    // MongoID
    if(!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    // Name
    if(!pokemon) {
      pokemon = await this.pokemonModel.findOne({name: term.toLocaleLowerCase().trim()})
    }

    if(!pokemon) 
      throw new NotFoundException(`Pokemon with id, name or No. "${term} Not Found"`)
    
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    await this.findOne(term);
    
    if(updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();
    }

    try {
      const pokemon = await this.pokemonModel.findByIdAndUpdate(term, {$set: updatePokemonDto}, {new: true});
      return pokemon;
    } catch (error) {
      this.handleExceptions(error, 'update')
    }
    
  }

  async remove(id: string) {
    const result = await this.pokemonModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundException(`Pokemon with id: "${id}" not found`);
    }
    return;
   
  }

  private handleExceptions(error: any, message: string) {
    if(error.code === 11000) {
      throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`)
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't ${message} Pokemon - Check server logs`)
  }
  
}
