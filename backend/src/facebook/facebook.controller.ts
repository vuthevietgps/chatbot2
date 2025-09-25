import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller()
export class FacebookController {
  constructor(private readonly service: FacebookService) {}

  @Post('fanpages/:pageId/subscribe')
  subscribe(@Param('pageId') pageId: string) {
    return this.service.subscribe(pageId);
  }

  @Delete('fanpages/:pageId/unsubscribe')
  unsubscribe(@Param('pageId') pageId: string) {
    return this.service.unsubscribe(pageId);
  }

  @Get('fanpages/:pageId/check-token')
  checkToken(@Param('pageId') pageId: string) {
    return this.service.checkToken(pageId);
  }

  @Post('fanpages/:pageId/refresh-token')
  refresh(@Param('pageId') pageId: string, @Body() dto: RefreshTokenDto) {
    return this.service.refreshToken(pageId, dto.newAccessToken);
  }
}
